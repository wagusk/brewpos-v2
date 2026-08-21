export const money = (value = 0) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);

export const title = (value: string) =>
  value.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
