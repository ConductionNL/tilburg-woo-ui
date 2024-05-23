export const AcGetPagination = (current, { range, pages, start = 1 }) => {
  const paging = [];
  let i = Math.min(
    pages + start - range,
    Math.max(start, current - ((range / 2) | 0))
  );

  // Determine the smallest pagenumber to render
  i = i < start ? start : i;

  // Determine the largest pagenumber to render
  let end = i + range;
  end = end > pages ? pages : end;

  while (i <= end) {
    const item = {
      num: i,
      current: i === current,
    };
    paging.push(item);
    i++;
  }

  return paging;
};

export default AcGetPagination;
