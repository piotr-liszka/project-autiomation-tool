export const parseToNumber = (str: string) => {
  const replaced = str.replace(/\D/g, '');

  if (isNaN(Number(replaced))) {
    return null;
  }
  return Number(replaced);
}