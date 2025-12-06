import { useState } from "react";
import { getSession } from "../../../../commons/libs/supabase/auth";
import { callDeepseek } from "../../../../commons/libs/deepseek/deekseekClient";

export default function LLMSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      console.log("Search query is empty");
      return;
    }

    setSearching(true);
    console.log("=== LLM Chat Search ===");
    console.log("User Query:", searchQuery);

    try {
      const session = await getSession();

      if (!session?.access_token || !session?.user?.id) {
        throw new Error("No session or user ID available");
      }

      // Call Deepseek API
      const response = await callDeepseek(
        session.access_token,
        session.refresh_token,
        session.user.id,
        searchQuery,
        1000
      );

      console.log("LLM Response:", response);
      console.log("=== End of Search ===");

      alert("Check the console for LLM chat output!");
    } catch (err: any) {
      console.error("Search error:", err);
      alert("Search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Ask something about your boards..."
        disabled={searching}
        style={{
          flex: 1,
          padding: "10px",
          fontSize: "16px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        type="submit"
        disabled={searching}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: searching ? "not-allowed" : "pointer",
        }}
      >
        {searching ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
