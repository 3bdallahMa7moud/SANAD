'use client';

import { ChevronDown } from 'lucide-react';
import { useLocale } from 'next-intl';
import * as React from 'react';
import PhoneInput, {
  getCountryCallingCode,
  type Country,
  type Value,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import arLabels from 'react-phone-number-input/locale/ar.json';
import enLabels from 'react-phone-number-input/locale/en.json';

import { cn } from '@/lib/utils/cn';

interface CountryOption {
  divider?: boolean;
  label: string;
  value?: Country;
}

interface CountryIconProps {
  'aria-hidden'?: boolean;
  aspectRatio?: number;
  country?: Country;
  label?: string;
}

interface CountrySelectProps {
  'aria-label'?: string;
  disabled?: boolean;
  iconComponent: React.ElementType<CountryIconProps>;
  name?: string;
  onBlur?(): void;
  onChange(value?: Country): void;
  onFocus?(): void;
  options: CountryOption[];
  readOnly?: boolean;
  value?: Country;
}

function CountrySelect({
  'aria-label': ariaLabel,
  disabled,
  iconComponent: Icon,
  name,
  onBlur,
  onChange,
  onFocus,
  options,
  readOnly,
  value,
}: CountrySelectProps) {
  const locale = useLocale();
  const selectedOption = options.find(
    (option) => !option.divider && option.value === value,
  );

  return (
    <div className="sanad-phone-country" dir="ltr">
      <select
        aria-label={ariaLabel}
        className="sanad-phone-country-select"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        disabled={disabled || readOnly}
        name={name}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value as Country)}
        onFocus={onFocus}
        value={value}
      >
        {options.map((option) => (
          <option
            disabled={option.divider}
            key={option.divider ? 'divider' : option.value}
            value={option.divider ? '' : option.value}
          >
            {option.value
              ? `+${getCountryCallingCode(option.value)} — ${option.label}`
              : option.label}
          </option>
        ))}
      </select>
      <Icon aria-hidden country={value} label={selectedOption?.label} />
      <span className="sanad-phone-country-code" aria-hidden="true">
        {value ? `+${getCountryCallingCode(value)}` : '+'}
      </span>
      <ChevronDown aria-hidden="true" className="sanad-phone-country-arrow" />
    </div>
  );
}

export interface InternationalPhoneInputProps {
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-labelledby'?: string;
  'aria-required'?: React.AriaAttributes['aria-required'];
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onBlur?(): void;
  onChange(value: string): void;
  placeholder?: string;
  value?: string;
}

export function InternationalPhoneInput({
  'aria-invalid': ariaInvalid,
  invalid,
  onChange,
  value,
  ...props
}: InternationalPhoneInputProps) {
  const locale = useLocale();
  const hasError = invalid || ariaInvalid === true || ariaInvalid === 'true';

  return (
    <PhoneInput
      {...props}
      addInternationalOption={false}
      aria-invalid={hasError || undefined}
      className={cn('sanad-phone-input', hasError && 'is-invalid')}
      countryOptionsOrder={[
        'AE',
        'SA',
        'EG',
        'KW',
        'QA',
        'BH',
        'OM',
        'JO',
        'LB',
        'IQ',
        '|',
        '...',
      ]}
      countrySelectComponent={CountrySelect}
      defaultCountry="AE"
      flags={flags}
      labels={locale === 'ar' ? arLabels : enLabels}
      limitMaxLength
      onChange={(nextValue?: Value) => onChange(nextValue ?? '')}
      value={value || undefined}
    />
  );
}
