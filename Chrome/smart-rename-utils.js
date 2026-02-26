/**
 * Smart Rename utilities for applying user-defined filename rules
 */

const SmartRenameUtils = {
  /**
   * Apply an ordered list of rename rules to a filename.
   * Rules are applied sequentially; each rule sees the output of the previous.
   * @param {string} filename
   * @param {Array<Object>} rules
   * @returns {string}
   */
  applyRules(filename, rules) {
    if (!rules || rules.length === 0) return filename;

    let result = filename;

    for (const rule of rules) {
      if (!rule.type) continue;

      switch (rule.type) {
        case 'replace': {
          const find = rule.find;
          if (find && find.length > 0) {
            // Use split/join for literal global replacement (avoids regex escaping)
            result = result.split(find).join(rule.replaceWith || '');
          }
          break;
        }

        case 'remove': {
          const text = rule.text;
          if (text && text.length > 0) {
            result = result.split(text).join('');
          }
          break;
        }

        case 'addEnd': {
          if (rule.text) {
            result = result + rule.text;
          }
          break;
        }

        case 'addBeginning': {
          if (rule.text) {
            result = rule.text + result;
          }
          break;
        }

        case 'moveAfterDate': {
          const text = rule.text;
          if (text && text.length > 0 && result.includes(text)) {
            // Only act if the text is actually present in the filename
            const withoutText = result.split(text).join('').replace(/\s+/g, ' ').trim();
            const dateMatch = withoutText.match(/^(\d{4} \d{2} \d{2})\s*/);
            if (dateMatch) {
              // Insert immediately after the date prefix
              const rest = withoutText.slice(dateMatch[0].length).trim();
              result = dateMatch[1] + ' ' + text + (rest ? ' ' + rest : '');
            }
            // If no date prefix found, leave the filename unchanged
          }
          break;
        }

        case 'prependDate': {
          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const d = String(now.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          result = `${dateStr} - ${result}`;
          break;
        }

        case 'underscoreSpaces': {
          result = result.replace(/\s+/g, '_');
          break;
        }

        case 'removeSpecial': {
          // Split into filename and extension to preserve the dot before extension
          const lastDot = result.lastIndexOf('.');
          if (lastDot > 0) {
            const name = result.substring(0, lastDot);
            const ext = result.substring(lastDot);
            const cleanName = name.replace(/[^a-zA-Z0-9._-]/g, '');
            result = cleanName + ext;
          } else {
            result = result.replace(/[^a-zA-Z0-9._-]/g, '');
          }
          break;
        }

        case 'titleCase': {
          // Split into filename and extension
          const lastDot = result.lastIndexOf('.');
          const name = lastDot > 0 ? result.substring(0, lastDot) : result;
          const ext = lastDot > 0 ? result.substring(lastDot) : '';

          const titleName = name.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });

          result = titleName + ext;
          break;
        }

        case 'camelCase': {
          // Split into filename and extension
          const lastDot = result.lastIndexOf('.');
          const name = lastDot > 0 ? result.substring(0, lastDot) : result;
          const ext = lastDot > 0 ? result.substring(lastDot) : '';

          const words = name.split(/[-_\s]+/);
          const camelName = words
            .map(word => {
              if (word.length === 0) return '';
              return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
            })
            .join('');

          result = camelName + ext;
          break;
        }
      }

      // Normalise whitespace after every rule (unless it's underscoreSpaces where we don't want spaces anyway)
      if (!['underscoreSpaces', 'camelCase'].includes(rule.type)) {
        result = result.replace(/\s+/g, ' ').trim();
      }
    }

    return result;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartRenameUtils;
}
