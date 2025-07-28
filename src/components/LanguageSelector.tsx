import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LucideLanguages from "~icons/lucide/languages";

const languages = {
  en: "English",
  "zh-TW": "中文",
};
export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("zh-TW");
  useEffect(() => {
    // selected language = url pathname
    const pathname = window.location.pathname;
    const langMatch = pathname.match(/^\/(en|zh-TW)/);
    if (langMatch) {
      setSelectedLanguage(langMatch[1]);
    } else {
      setSelectedLanguage("zh-TW"); // default language
    }
  }, []);
  // auto switch language after selecting a language
  const handleLanguageChange = (lang: string) => {
    const newPath = window.location.pathname.replace(
      /^(\/en|\/zh-TW)/,
      `/${lang}`
    );
    window.history.pushState({}, "", newPath);
    location.reload(); // reload to apply the new language
  };

  return (
    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40 gap-2">
        <LucideLanguages />
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([lang, label]) => (
          <SelectItem key={lang} value={lang}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
