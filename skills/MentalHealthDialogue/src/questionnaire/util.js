const SETENCE_TERMINATORS = ['.', ',', '!', '?', '>'];

const utils = {
    asDate(dateStr) {
        return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    },

    breakForSec(sec) {
        return ` <break time="${sec.toFixed(1)}s"/> `;
    },

    dedupe(list) {
        return [...(new Set(list))];
    },

    randomChoice(list) {
        return list[Math.floor(Math.random() * list.length)];
    },

    sentenceJoin(phrases, sep) {
        return phrases
            .filter(Boolean)
            .map(s => s.toString().trim())
            .filter(Boolean)
            .map(s => SETENCE_TERMINATORS.includes(s.charAt(s.length-1))
                ? s
                : (s + '.')
            )
            .join(sep || ' ');
    },

    uniqueValues(witEntity) {
        if (witEntity == null) return [];
        return utils.dedupe(witEntity.map(ent => ent.value));
    },
};

module.exports = utils;