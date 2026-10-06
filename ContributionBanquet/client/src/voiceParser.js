export const parseVoiceInput = (text) => {
  const rawText = String(text || "").trim();
  const cleanText = rawText
    .replace(/(?<=\d),\s*(?=\d)/g, "")
    .replace(/[.,!?;]+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parsed = { name: "", city: "", amount: "" };

  const numberWords = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    lakh: 100000,
    lakhs: 100000,
  };

  const parseWordAmount = (value) => {
    const normalized = String(value || "")
      .toLowerCase()
      .replace(/(?:rupees?|rs|₹)/gi, "")
      .replace(/\band\b/g, " ")
      .replace(/,/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized || !/[a-z]/i.test(normalized)) {
      return "";
    }

    let total = 0;
    let current = 0;

    const tokens = normalized.split(" ").filter(Boolean);
    for (const token of tokens) {
      if (!(token in numberWords)) {
        continue;
      }

      const amount = numberWords[token];

      if (token === "hundred") {
        current *= 100;
      } else if (token === "thousand") {
        total += current * 1000;
        current = 0;
      } else if (token === "lakh" || token === "lakhs") {
        total += current * 100000;
        current = 0;
      } else if (amount < 100) {
        current += amount;
      }
    }

    total += current;
    return total > 0 ? String(total) : "";
  };

  const trimFieldValue = (value) =>
    (value || "")
      .replace(/\s+(?:and|then|also|but|so)\s*$/i, "")
      .replace(/^(?:is|=|:)\s*/i, "")
      .trim();

  const captureAfterLabel = (labelPattern, nextKeywords) => {
    const match = cleanText.match(labelPattern);
    if (!match) return "";

    const raw = match[1] || "";
    const value = trimFieldValue(raw);

    if (!value) return "";

    const stopPattern = new RegExp(`\\s+(?:${nextKeywords.join("|")})\\b`, "i");
    return value.replace(stopPattern, "").trim();
  };

  const namePatterns = [
    /(?:(?:contributor|my)\s+|என்\s+|பங்களிப்பாளர்\s+)?(?:name|பெயர்)\s*(?:is|=|:|என்று)?\s*([A-Za-z\u0B80-\u0BFF][A-Za-z\u0B80-\u0BFF' -]*?)(?=\s+(?:native\s+place|place|city|from|amount|gift|rupees|rs|₹|name|my|contributor|and|then|also|but|so|சொந்த\s+ஊர்|ஊர்|தொகை|ரூபாய்|பணம்|பெயர்)(?:\s|$)|$)/i,
  ];

  for (const pattern of namePatterns) {
    const result = captureAfterLabel(pattern, [
      "native\\s+place",
      "place",
      "city",
      "from",
      "amount",
      "gift",
      "rupees",
      "rs",
      "contributor",
      "சொந்த\\s+ஊர்",
      "ஊர்",
      "தொகை",
      "ரூபாய்",
      "பணம்",
      "பெயர்",
      "and",
      "then",
      "also",
      "but",
      "so"
    ]);
    if (result) {
      parsed.name = result;
      break;
    }
  }

  if (!parsed.name) {
    const introductionMatch = cleanText.match(
      /^(?:i am|i'm|this is|contributor is|donor is|நான்)\s+([\p{L}][\p{L}' -]*?)(?=\s+(?:from|native\s+place|place|city|amount|gift|rupees|rs|₹|சொந்த\s+ஊர்|ஊர்|தொகை|ரூபாய்|பணம்)(?:\s|$)|\s+\d|$)/iu
    );
    const prefixMatch = cleanText.match(
      /^([\p{L}][\p{L}' -]*?)\s+(?:from|native\s+place|place|city|amount|gift|rupees|rs|₹|சொந்த\s+ஊர்|ஊர்|தொகை|ரூபாய்|பணம்)(?:\s|$)/iu
    );
    parsed.name = (introductionMatch?.[1] || prefixMatch?.[1] || "").trim();
  }

  const cityPatterns = [
    /(?:native\s+place|place|city|சொந்த\s+ஊர்|ஊர்)\s*(?:is|=|:|இருந்து|என்று)?\s*([A-Za-z\u0B80-\u0BFF][A-Za-z\u0B80-\u0BFF' -]*?)(?=\s+(?:amount|gift|rupees|rs|₹|name|my|contributor|and|then|also|but|so|பெயர்|தொகை|ரூபாய்|பணம்|சொந்த\s+ஊர்|ஊர்)(?:\s|$)|\s+\d|$)/i,
    /(?:from)\s+([A-Za-z\u0B80-\u0BFF][A-Za-z\u0B80-\u0BFF' -]*?)(?=\s+(?:amount|gift|rupees|rs|₹|name|my|contributor|and|then|also|but|so|பெயர்|தொகை|ரூபாய்|பணம்)(?:\s|$)|\s+\d|$)/i,
  ];

  for (const pattern of cityPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const value = trimFieldValue(match[1]);
      if (value) {
        parsed.city = value;
        break;
      }
    }
  }

  const lakhMatch = cleanText.match(
    /(\d[\d,]*)\s*(?:lakhs?|லட்சம்)(?:\s+(\d[\d,]*))?/i
  );
  if (lakhMatch) {
    const lakhValue = Number(lakhMatch[1].replace(/,/g, "")) * 100000;
    const remainingValue = Number((lakhMatch[2] || "0").replace(/,/g, ""));
    parsed.amount = String(lakhValue + remainingValue);
  } else {
    const amountKeywordIndex = cleanText.search(/\b(?:amount|gift|rupees|rs|₹|தொகை|ரூபாய்|பணம்)\b/i);

    if (amountKeywordIndex >= 0) {
      const remainder = cleanText.slice(amountKeywordIndex + cleanText.slice(amountKeywordIndex).match(/\b(?:amount|gift|rupees|rs|₹|தொகை|ரூபாய்|பணம்)\b/i)?.[0].length || 0).trim();
      const trimmedRemainder = remainder.replace(/^(?:is|=|:|என்று)\s*/i, "").trim();
      const candidate = trimmedRemainder
        .split(/\s+(?:and|native\s+place|place|city|from|name|my|contributor|பெயர்|சொந்த\s+ஊர்|ஊர்)\b/i)[0]
        .trim();

      const literalAmount = candidate;
      const numberWordAmount = literalAmount ? parseWordAmount(literalAmount) : "";

      if (numberWordAmount) {
        parsed.amount = numberWordAmount;
      } else if (candidate) {
        const numericValue = candidate.match(/\d[\d,]*(?:\.\d+)?/);
        if (numericValue) {
          parsed.amount = numericValue[0].replace(/,/g, "");
        }
      }
    }

    if (!parsed.amount) {
      const numericMatch = cleanText.match(
        /(?:amount|gift|rupees|rs|₹|தொகை|ரூபாய்|பணம்)\s*(?:is|=|:|என்று)?\s*(?:₹)?\s*(\d[\d,]*(?:\.\d+)?)(?=\s+(?:and|native|place|city|from|name|my|contributor|பெயர்|சொந்த\s+ஊர்|ஊர்)\b|$)/i
      );
      const fallbackNumber = cleanText.match(/\d[\d,]*(?:\.\d+)?/);
      const amount = numericMatch?.[1] || fallbackNumber?.[0];
      if (amount) {
        parsed.amount = amount.replace(/,/g, "");
      }
    }
  }

  const spokenParts = rawText
    .split(/[,;]+|(?<=[\p{L}])[.!?]+\s+/u)
    .map((part) => part.replace(/[.!?]+$/g, "").trim())
    .filter(Boolean);
  const spokenValues = spokenParts
    .filter((part) => !/\d/.test(part))
    .map((part) =>
      part
        .replace(/^(?:(?:my|contributor)\s+)?(?:name|native\s+place|place|city)\s*(?:is|:)?\s*/i, "")
        .replace(/^(?:பெயர்|சொந்த\s+ஊர்|ஊர்)\s*(?:என்று)?\s*/i, "")
        .trim()
    )
    .filter(Boolean);

  if (!parsed.name && spokenValues.length >= 2) {
    parsed.name = spokenValues[0];
  }

  if (!parsed.city && spokenValues.length >= 2) {
    parsed.city = spokenValues[1];
  }

  if (!parsed.city) {
    const knownPlaces = [
      "tiruchengode",
      "tirupattur",
      "tirupathur",
      "coimbatore",
      "hyderabad",
      "bangalore",
      "chennai",
      "madurai",
      "trichy",
      "salem",
      "delhi",
      "mumbai",
    ];
    const placeMatch = knownPlaces
      .map((place) => ({
        place,
        match: new RegExp(`(^|[^\\p{L}])${place}(?=$|[^\\p{L}])`, "iu").exec(cleanText),
      }))
      .find(({ match }) => match);

    if (placeMatch) {
      parsed.city = placeMatch.match[0].trim();
      if (!parsed.name) {
        parsed.name = cleanText.slice(0, placeMatch.match.index).trim();
      }
    }
  }

  return parsed;
};

export const parseVoiceField = (field, text) => {
  const spokenText = (text || "")
    .replace(/[.,!?;]+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parsed = parseVoiceInput(spokenText);

  if (field === "name") {
    return (
      parsed.name ||
      spokenText
        .replace(/^(?:(?:my|contributor)\s+)?name\s*(?:is\s*)?|^(?:i am|i'm|this is|பெயர்|என்\s+பெயர்)\s*/i, "")
        .trim()
    );
  }

  if (field === "city") {
    return (
      parsed.city ||
      spokenText
        .replace(/^(?:native\s+place|place|city|from|சொந்த\s+ஊர்|ஊர்)\s*(?:(?:is|என்று)\s*)?/i, "")
        .trim()
    );
  }

  if (field === "amount") {
    return parsed.amount;
  }

  return "";
};

export const applyVoiceInput = (currentValues, text, activeField = null) => {
  const parsed = parseVoiceInput(text);
  const focusedValue = activeField ? parseVoiceField(activeField, text) : "";

  return {
    ...currentValues,
    name:
      parsed.name ||
      (activeField === "name" ? focusedValue : "") ||
      currentValues.name,
    city:
      parsed.city ||
      (activeField === "city" ? focusedValue : "") ||
      currentValues.city,
    amount:
      parsed.amount ||
      (activeField === "amount" ? focusedValue : "") ||
      currentValues.amount,
  };
};
