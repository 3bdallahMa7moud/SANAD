UPDATE "package_images"
SET "image_path" = regexp_replace("image_path", '\.(png|jpg|jpeg)$', '.webp', 'i')
WHERE "image_path" IN (
  '/images/packages/golden-signature-package.png',
  '/images/packages/career-excellence-package.png',
  '/images/packages/professional-distinction-package.png',
  '/images/packages/professional-cv.png',
  '/images/packages/linkedin-profile-optimization.png',
  '/images/packages/job-application-service.png'
);
