export const AcValidateDate = (date) => {
  // Assumes s is "dd/mm/yyyy"
  if (!/^\d\d\-\d\d\-\d\d\d\d$/.test(date)) {
    return false;
  }
  const parts = date.split('-').map((p) => parseInt(p, 10));
  parts[1] -= 1;
  const d = new Date(parts[2], parts[1], parts[0]);
  return (
    d.getDate() === parts[0] &&
    d.getMonth() === parts[1] &&
    d.getFullYear() === parts[2]
  );
};
