import React from 'react';
import { Link } from '@utrecht/component-library-react/dist/css-module';

/**
 * Helper function to determine the actual runtime type of a value
 * @param {*} value - The value to check
 * @returns {string} - The actual type of the value
 */
function getActualType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Render a value according to its JSON-Schema definition.
 *
 * @param {object} schema             The schema for this property (must include `type`, may include `format`, `items`, `properties`, `enum`, `description`).
 * @param {*}      value              The actual data value to format/render.
 * @param {string} key                The key of the property to format. When nothing passed the `value` property will act as the primitive value.
 * @param {object} [options]          Rendering options:
 * - include: array of property keys to show for objects (default: all)
 * - exclude: array of property keys to exclude for objects (default: none)
 * - inline: boolean, if true render object as inline text (default: false)
 * - includeUnknown: boolean, if true render object properties not defined in schema (default: false)
 * - profile: object mapping property keys to per-key option overrides
 */
function formatBySchema(schema, data, dataKey, options = {}) {
  // if dataKey is passed, grab that property; otherwise data itself is the value
  const value = dataKey != null ? data[dataKey] : data;

  if (!value) {
    return <span>-</span>;
  }

  // Get the actual runtime type of the value, as the schema type is in practice not always the actual type
  const actualType = getActualType(value);

  switch (actualType) {
    case 'string': {
      // handle enums first
      if (schema.enum) {
        return <span>{value}</span>;
      }
      switch (schema.format) {
        // custom date formatting
        case 'date': {
          const d = new Date(value);
          return <time dateTime={value}>{d.toLocaleDateString()}</time>;
        }
        case 'date-time': {
          const d = new Date(value);
          return <time dateTime={value}>{d.toLocaleString()}</time>;
        }
        case 'time': {
          const d = new Date(`1970-01-01T${value}`);
          return <time dateTime={value}>{d.toLocaleTimeString()}</time>;
        }
        case 'duration': {
          // basic ISO 8601 duration → "PT1H30M" → "1 h 30 m"
          const [, hours, mins] = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(value) || [];
          const parts = [];
          if (hours) parts.push(`${hours} h`);
          if (mins) parts.push(`${mins} m`);
          return <span>{parts.join(' ') || value}</span>;
        }
        case 'password': {
          // hide the real password length, always show 8 dots
          return <span>••••••••</span>;
        }
        case 'url':
        case 'uri': {
          // render as clickable link
          return (
            <Link href={value} target='_blank' rel='noopener noreferrer'>
              {value}
            </Link>
          );
        }
        // passthrough formats:
        case 'uuid':
        case 'email':
        case 'ipv4':
        case 'ipv6':
        case 'kvk':
        case 'bsn':
        case 'rsin':
        case 'telephone':
        case 'binary':
        case 'byte':
        case 'extension':
        case 'filename':
          return <span>{value}</span>;

        // fallback: unknown format
        default:
          return <span>{value}</span>;
      }
    }

    case 'number':
    case 'integer': {
      return <span>{value}</span>;
    }

    case 'boolean': {
      return <span>{value ? 'Ja' : 'Nee'}</span>;
    }

    case 'array': {
      if (!Array.isArray(value)) return <em>Invalid array</em>;
      return (
        <ul>
          {value.length === 0 && <span>-</span>}
          {value.map((item, i) => (
            <li style={{ marginInlineStart: '16px' }} key={i}>
              {formatBySchema(
                schema.items,
                item,
                null,
                options.profile[dataKey] || options
              )}
            </li>
          ))}
        </ul>
      );
    }

    case 'object': {
      if (typeof value !== 'object') return <em>Invalid object</em>;

      let currentOptions = {
        include: options.include,
        inline: options.inline,
        includeUnknown: options.includeUnknown,
        exclude: options.exclude,
        profile: options.profile || {},
      };

      // use profile options if defined
      if (currentOptions.profile[dataKey]) {
        currentOptions = {
          include: currentOptions.profile[dataKey].include,
          inline: currentOptions.profile[dataKey].inline,
          includeUnknown: currentOptions.profile[dataKey].includeUnknown,
          exclude: currentOptions.profile[dataKey].exclude,
          profile: currentOptions.profile[dataKey].profile || {},
        };
      }

      const props = schema.properties || {};

      // Simplified key selection: unknown first, then known; then apply include filter.
      const knownKeys = Object.keys(props);
      const unknownKeys = currentOptions.includeUnknown
        ? Object.keys(value).filter((k) => !props.hasOwnProperty(k))
        : [];
      let keys = [...unknownKeys, ...knownKeys];

      if (currentOptions?.include) {
        const includeSet = new Set(currentOptions.include);
        keys = keys.filter((k) => includeSet.has(k));
      }

      if (currentOptions?.exclude) {
        const excludeSet = new Set(currentOptions.exclude);
        keys = keys.filter((k) => !excludeSet.has(k));
      }

      const entries = keys.map((key) => {
        const childSchema = props[key];
        // use per-key profile options if defined
        return [key, childSchema];
      });

      if (entries.length === 0) {
        return <span>-</span>;
      }

      if (currentOptions?.inline) {
        return (
          <span>
            {entries.map(([key, childSchema], idx) => (
              <React.Fragment key={key}>
                {childSchema ? (
                  formatBySchema(childSchema, value, key, currentOptions)
                ) : (
                  <span>
                    {value[key] === undefined || value[key] === null
                      ? '-'
                      : typeof value[key] === 'object'
                      ? JSON.stringify(value[key])
                      : value[key]}
                  </span>
                )}
                {idx < entries.length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
          </span>
        );
      }

      return (
        <div style={{ paddingLeft: 12, borderLeft: '2px solid #eee' }}>
          {entries.map(([key, childSchema]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <strong style={{ display: 'block' }}>
                {(childSchema && childSchema.description) || key}
              </strong>
              {childSchema ? (
                formatBySchema(childSchema, value, key, currentOptions)
              ) : value[key] === undefined || value[key] === null ? (
                <span>-</span>
              ) : typeof value[key] === 'object' ? (
                <pre>{JSON.stringify(value[key], null, 2)}</pre>
              ) : (
                <span>{value[key]}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    default:
      return <code>Unsupported type "{actualType}"</code>;
  }
}

export default formatBySchema;
