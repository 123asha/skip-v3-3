// The label shown above a case preview: the case's categories in the same
// three buckets as the tabs on the cases page (Брендинг · Веб · Продукт),
// in that order, at most two.
const BUCKETS: { label: string; cats: string[] }[] = [
  { label: 'Брендинг', cats: ['branding'] },
  { label: 'Веб', cats: ['sites', 'instruments'] },
  { label: 'Продукт', cats: ['interfaces'] },
];

export function caseCategories(cats: string[]): string {
  return BUCKETS.filter(b => b.cats.some(c => cats.includes(c)))
    .slice(0, 2)
    .map(b => b.label)
    .join(', ');
}
