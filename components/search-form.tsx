"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SearchFormProps = {
  initialQuery: string;
};

export function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      router.push("/discover");
      return;
    }
    router.push(`/discover?q=${encodeURIComponent(query)}`);
  };

  return (
    <form className="flex w-full flex-col gap-[8px]" onSubmit={handleSubmit}>
      <label
        className="text-[14px] font-medium text-[#757575] [font-family:var(--font-instrument-sans)]"
        htmlFor="search-input"
      >
        Search
      </label>
      <div className="flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-white px-[16px] py-[12px]">
        <input
          id="search-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Try “Mona Lisa” or “da Vinci”"
          className="w-full bg-transparent text-[16px] text-[#1e1e1e] outline-none placeholder:text-[#9a9a9a] [font-family:var(--font-instrument-sans)]"
        />
        <button
          className="rounded-full border border-[#d9d9d9] px-[12px] py-[6px] text-[14px] font-medium text-[#5a5a5a] [font-family:var(--font-instrument-sans)]"
          type="submit"
        >
          Go
        </button>
      </div>
    </form>
  );
}
