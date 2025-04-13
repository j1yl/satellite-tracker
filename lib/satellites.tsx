function validateSatelliteName(name: string): boolean {
  const validPattern = /^[A-Za-z0-9-_]+$/;
  const isValid = validPattern.test(name);
  if (!isValid) {
    console.warn(
      `Invalid satellite name format: ${name}. Satellite names should contain only letters, numbers, hyphens, and underscores.`,
    );
  }
  return isValid;
}
