// Imports => Utilities
import { AcIsSet, AcIsArray, AcIsObject } from './ac-get-type-of';
import { AcSortBy } from './ac-sort-by';

export const AcFormatRawDataAsList = class {
  constructor(raw, fields, sortBy = 'name', single = false, options = {}) {
    this.raw = raw || [];
    this.fields = fields || {};
    this.sortBy = sortBy;
    this.single = single || false;
    this.arrayGlue = options.arrayGlue || ', ';

    if (AcIsSet(raw) && AcIsSet(fields)) {
      const result = this.enrichRawData();

      return result;
    }
  }

  getValueFromObject = (item, key) => {
    let output = null;

    if (AcIsSet(item[key])) {
      output = item[key];
    } else if (AcIsArray(item)) {
      const len = item.length;
      let n = 0;
      output = [];

      for (n; n < len; n++) {
        const obj = item[n];

        if (AcIsObject(obj) && obj.key === key) {
          output = obj;
          break;
        } else if (AcIsArray(obj)) {
          obj.forEach((it) => {
            if (it.key === key) {
              output.push(it.value);
            }
          });
        }
      }

      if (AcIsArray(output)) output = output.join(this.arrayGlue);
    }

    return output && output.value ? output.value : output;
  };

  enrichRawData = () => {
    const data = this.raw;
    const fields = this.fields;
    const sortBy = this.sortBy;
    const single = this.single;
    let result = null;

    if (!AcIsSet(single) || !single) {
      const len = data.length;
      let n = 0;
      result = [];

      for (n; n < len; n++) {
        const item = data[n];
        let formatted = {};

        for (let key in fields) {
          const form = fields[key];
          const value = this.getValueFromObject(item, form);
          const lowerform = key.toLowerCase();

          if (AcIsSet(value)) formatted[lowerform] = value;
          else formatted[lowerform] = '-';
        }

        result.push(formatted);
      }

      if (AcIsSet(this.sortBy))
        result = AcSortBy({
          collection: result,
          field: sortBy,
          direction: 'asc',
        });
    } else if (AcIsSet(single)) {
      result = Object.keys(fields).reduce((new_item, _key) => {
        const field = fields[_key];

        const lowerform = _key.toLowerCase();
        new_item[lowerform] = this.getValueFromObject(data, field);

        return new_item;
      }, {});
    }

    return result;
  };
};
