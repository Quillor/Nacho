export interface CaptionLanguage {
  code: string;
  label: string;
}

/** BCP-47 language tags supported by the Web Speech API for live captions. */
export const CAPTION_LANGUAGES: CaptionLanguage[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-419", label: "Spanish (Latin America)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "nl-NL", label: "Dutch" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ru-RU", label: "Russian" },
  { code: "ar-SA", label: "Arabic" },
];

export const DEFAULT_CAPTION_LANG = "en-US";

export function captionLanguageLabel(code: string | null): string {
  if (!code) return "Off";
  return CAPTION_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
