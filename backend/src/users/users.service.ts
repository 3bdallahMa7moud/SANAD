import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeAdminPermissions } from '../common/permissions';
import {
  CreateAdministratorDto,
  ResetAdministratorPasswordDto,
  UpdateAdministratorDto,
  UpdateProfileDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        gender: true,
        career_profile: true,
        role: true,
        admin_permissions: true,
        email_verified: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const firstName = dto.first_name?.trim();
    const lastName = dto.last_name?.trim();
    const effectiveFirstName = firstName ?? user.first_name;
    const effectiveLastName = lastName ?? user.last_name;
    const syncedName =
      effectiveFirstName || effectiveLastName
        ? [effectiveFirstName, effectiveLastName].filter(Boolean).join(' ')
        : dto.name;
    const currentCareerProfile =
      user.career_profile &&
      typeof user.career_profile === 'object' &&
      !Array.isArray(user.career_profile)
        ? user.career_profile
        : {};
    const careerProfile = dto.career_profile
      ? Object.fromEntries(
          Object.entries(dto.career_profile).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value,
          ]),
        )
      : undefined;

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(syncedName !== undefined && { name: syncedName }),
        ...(firstName !== undefined && { first_name: firstName }),
        ...(lastName !== undefined && { last_name: lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(careerProfile !== undefined && {
          career_profile: { ...currentCareerProfile, ...careerProfile },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        gender: true,
        career_profile: true,
        role: true,
        admin_permissions: true,
        email_verified: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async listAdministrators() {
    const administrators = await this.prisma.users.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        admin_permissions: true,
        email_verified: true,
        account_locked: true,
        last_login: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return administrators.map((administrator) => ({
      ...administrator,
      admin_permissions:
        administrator.role === 'super_admin'
          ? null
          : normalizeAdminPermissions(administrator.admin_permissions),
    }));
  }

  async createAdministrator(dto: CreateAdministratorDto, requesterId: number) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.users.findUnique({ where: { email } })) {
      throw new ConflictException('Email is already in use');
    }
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const permissions =
      dto.role === 'super_admin'
        ? null
        : (normalizeAdminPermissions(dto.permissions ?? []) ?? []);

    return this.prisma.$transaction(async (tx) => {
      const administrator = await tx.users.create({
        data: {
          name: dto.name.trim(),
          email,
          password_hash: passwordHash,
          role: dto.role,
          admin_permissions: permissions === null ? Prisma.DbNull : permissions,
          email_verified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          admin_permissions: true,
          email_verified: true,
          account_locked: true,
          created_at: true,
        },
      });
      await tx.admin_activity_log.create({
        data: {
          admin_id: requesterId,
          action: 'create_administrator',
          table_name: 'users',
          record_id: administrator.id,
          description: `Created ${dto.role} account ${email}`,
          changes: { role: dto.role, permissions },
        },
      });
      return administrator;
    });
  }

  async updateAdministrator(
    id: number,
    dto: UpdateAdministratorDto,
    requesterId: number,
  ) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user || !['admin', 'super_admin'].includes(user.role))
      throw new NotFoundException('Administrator not found');
    if (id === requesterId && dto.role && dto.role !== user.role) {
      throw new BadRequestException(
        'You cannot change your own administrator role',
      );
    }
    if (id === requesterId && dto.active === false) {
      throw new BadRequestException(
        'You cannot disable your own administrator account',
      );
    }

    const nextRole = dto.role ?? user.role;
    const roleChanged = nextRole !== user.role;
    const disabling = dto.active === false && !user.account_locked;
    if (
      user.role === 'super_admin' &&
      (nextRole !== 'super_admin' || disabling)
    ) {
      await this.ensureAnotherActiveSuperAdmin(id);
    }

    const explicitPermissions =
      nextRole === 'admin'
        ? (normalizeAdminPermissions(dto.permissions) ??
          (roleChanged
            ? []
            : normalizeAdminPermissions(user.admin_permissions)) ??
          [])
        : null;
    const permissionsChanged = dto.permissions !== undefined || roleChanged;
    const securityChanged =
      roleChanged || dto.permissions !== undefined || dto.active !== undefined;

    return this.prisma.$transaction(async (tx) => {
      const administrator = await tx.users.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.role && { role: dto.role }),
          ...(permissionsChanged && {
            admin_permissions:
              explicitPermissions === null
                ? Prisma.DbNull
                : explicitPermissions,
          }),
          ...(dto.active !== undefined && {
            account_locked: !dto.active,
            locked_until: null,
            failed_login_attempts: dto.active ? 0 : undefined,
          }),
          ...(securityChanged && { token_version: { increment: 1 } }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          admin_permissions: true,
          email_verified: true,
          account_locked: true,
          last_login: true,
          created_at: true,
        },
      });
      if (securityChanged) {
        await tx.user_sessions.updateMany({
          where: { user_id: id, is_active: true },
          data: { is_active: false },
        });
      }
      await tx.admin_activity_log.create({
        data: {
          admin_id: requesterId,
          action: permissionsChanged
            ? 'update_administrator_permissions'
            : 'update_administrator',
          table_name: 'users',
          record_id: id,
          description: `Updated administrator account ${user.email}`,
          changes: {
            ...(dto.name !== undefined && {
              name: { from: user.name, to: dto.name.trim() },
            }),
            ...(roleChanged && { role: { from: user.role, to: nextRole } }),
            ...(permissionsChanged && {
              permissions: {
                from: normalizeAdminPermissions(user.admin_permissions),
                to: explicitPermissions,
              },
            }),
            ...(dto.active !== undefined && {
              active: { from: !user.account_locked, to: dto.active },
            }),
          },
        },
      });
      return administrator;
    });
  }

  async deleteAdministrator(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new BadRequestException(
        'You cannot delete your own administrator account',
      );
    }

    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      throw new NotFoundException('Administrator not found');
    }
    if (user.role === 'super_admin') {
      await this.ensureAnotherActiveSuperAdmin(id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.users.delete({ where: { id } });
      await tx.admin_activity_log.create({
        data: {
          admin_id: requesterId,
          action: 'delete_administrator',
          table_name: 'users',
          record_id: id,
          description: `Deleted administrator account ${user.email}`,
          changes: { role: user.role },
        },
      });
    });
    return { message: 'Administrator deleted successfully' };
  }

  async resetAdministratorPassword(
    id: number,
    dto: ResetAdministratorPasswordDto,
    requesterId: number,
  ) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user || !['admin', 'super_admin'].includes(user.role))
      throw new NotFoundException('Administrator not found');
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id },
        data: {
          password_hash: passwordHash,
          token_version: { increment: 1 },
        },
      });
      await tx.user_sessions.updateMany({
        where: { user_id: id, is_active: true },
        data: { is_active: false },
      });
      await tx.admin_activity_log.create({
        data: {
          admin_id: requesterId,
          action: 'reset_administrator_password',
          table_name: 'users',
          record_id: id,
          description: `Reset password for administrator ${user.email}`,
        },
      });
    });
    return { message: 'Administrator password reset successfully' };
  }

  private async ensureAnotherActiveSuperAdmin(excludedId: number) {
    const remaining = await this.prisma.users.count({
      where: {
        id: { not: excludedId },
        role: 'super_admin',
        OR: [{ account_locked: false }, { account_locked: null }],
      },
    });
    if (remaining === 0) {
      throw new BadRequestException(
        'At least one active Super Admin account must remain',
      );
    }
  }
}
