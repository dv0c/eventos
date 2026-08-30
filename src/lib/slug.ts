export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}

export async function generateUniqueEventSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;

  while (await checkExists(slug)) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  return generateUniqueEventSlug(name, checkExists);
}
