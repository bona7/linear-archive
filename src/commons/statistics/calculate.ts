import { BoardWithTags, Tag } from "../libs/supabase/db";
import { format, parseISO, isValid, getDay, differenceInDays } from "date-fns";

export interface Statistics {
  counts: {
    totalBoards: number;
    totalDefinedTags: number;
    totalUsedTags: number; // Unique tags actually used on boards
    orphanedTags: number;
  };
  habits: {
    mostActiveDay: string; // e.g., "Tuesday"
    longestStreak: number; // days
    currentStreak: number; // days
    activityHeatmap: Record<string, number>; // "YYYY-MM-DD" -> count
    weekendPercentage: number; // 0-100
  };
  tags: {
    mostUsed: { name: string; count: number; color: string }[];
    orphaned: Tag[];
    coOccurrence: { tags: [string, string]; count: number }[];
    density: number; // Avg tags per board
    topColors: string[]; // Most frequent tag colors
  };
  content: {
    richEntries: number; // Boards with Desc + Tags + Date
    avgDescriptionLength: number; // average characters
    commonKeywords: string[]; // Top words
  };
}

export function calculateStatistics(
  boards: BoardWithTags[],
  allTags: Tag[]
): Statistics {
  // 1. Basic Counts
  const totalBoards = boards.length;
  const totalDefinedTags = allTags.length;

  // Collect all used tag IDs and colors
  const usedTagIds = new Set<string>();
  const tagUsageCount: Record<string, number> = {};
  const colorUsageCount: Record<string, number> = {};

  boards.forEach((board) => {
    board.tags.forEach((tag) => {
      usedTagIds.add(tag.tag_id);
      tagUsageCount[tag.tag_id] = (tagUsageCount[tag.tag_id] || 0) + 1;
      
      const color = tag.tag_color.toLowerCase();
      colorUsageCount[color] = (colorUsageCount[color] || 0) + 1;
    });
  });

  const totalUsedTags = usedTagIds.size;
  const orphanedTagsList = allTags.filter((t) => !usedTagIds.has(t.tag_id));

  // 2. Tag Analysis
  // Most Used
  const mostUsed = allTags
    .map((tag) => ({
      name: tag.tag_name,
      color: tag.tag_color,
      count: tagUsageCount[tag.tag_id] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top Colors
  const topColors = Object.entries(colorUsageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color);

  // Co-occurrence
  const pairCounts: Record<string, number> = {};
  boards.forEach((board) => {
    const tags = board.tags;
    if (tags.length < 2) return;

    // Create unique pairs
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        // Sort names to ensure [A, B] is same as [B, A]
        const names = [tags[i].tag_name, tags[j].tag_name].sort();
        const key = names.join("::");
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  });

  const coOccurrence = Object.entries(pairCounts)
    .map(([key, count]) => ({
      tags: key.split("::") as [string, string],
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Density
  const totalTagsAssignments = boards.reduce(
    (sum, b) => sum + b.tags.length,
    0
  );
  const density = totalBoards > 0 ? totalTagsAssignments / totalBoards : 0;

  // 3. Habits (Time Analysis)
  const daysOfWeekCounter = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const activityHeatmap: Record<string, number> = {};
  let weekendCount = 0;

  // Helper to parse date safely
  const validBoards = boards
    .filter((b) => b.date)
    .map((b) => {
        // Handle potentially different date formats if necessary
        // Assuming YYYY-MM-DD or ISO string
        const d = new Date(b.date!);
        return isValid(d) ? d : null; 
    })
    .filter((d): d is Date => d !== null);
  
  // Sort for streak calc
  validBoards.sort((a, b) => a.getTime() - b.getTime());

  validBoards.forEach((date) => {
    const dayIndex = getDay(date);
    daysOfWeekCounter[dayIndex]++;
    
    // Weekend check (0 is Sunday, 6 is Saturday)
    if (dayIndex === 0 || dayIndex === 6) {
      weekendCount++;
    }

    // Heatmap
    const key = format(date, "yyyy-MM-dd");
    activityHeatmap[key] = (activityHeatmap[key] || 0) + 1;
  });

  const mostActiveDayIndex = daysOfWeekCounter.indexOf(
    Math.max(...daysOfWeekCounter)
  );
  const mostActiveDay = dayNames[mostActiveDayIndex];
  const weekendPercentage = validBoards.length > 0 
    ? Math.round((weekendCount / validBoards.length) * 100) 
    : 0;

  // Streaks
  let longestStreak = 0;
  let currentStreak = 0;
  let streak = 0;

  if (validBoards.length > 0) {
      // Remove duplicate days for streak calculation
      const uniqueDays = Array.from(new Set(validBoards.map(d => format(d, 'yyyy-MM-dd')))).sort();
      
      streak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
          const prev = parseISO(uniqueDays[i - 1]);
          const curr = parseISO(uniqueDays[i]);
          
          if (differenceInDays(curr, prev) === 1) {
              streak++;
          } else {
              longestStreak = Math.max(longestStreak, streak);
              streak = 1;
          }
      }
      longestStreak = Math.max(longestStreak, streak);
      
      // Check current streak (is the last entry today or yesterday?)
      const lastDay = parseISO(uniqueDays[uniqueDays.length - 1]);
      const today = new Date();
      const diffToToday = differenceInDays(today, lastDay);
      
      if (diffToToday <= 1) {
          currentStreak = streak;
      } else {
          currentStreak = 0;
      }
  }

  // 4. Content Analysis
  const richEntries = boards.filter(
    (b) => b.date && b.description && b.tags.length > 0
  ).length;

  const totalDescLength = boards.reduce(
    (sum, b) => sum + (b.description?.length || 0),
    0
  );
  const avgDescriptionLength =
    totalBoards > 0 ? totalDescLength / totalBoards : 0;

  // Simple Keyword Extraction
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "are", "was", "were", "it", "that", "this",
    "이", "그", "저", "것", "수", "등", "를", "을", "가", "이", "은", "는", "에", "의", "로", "으로", "하고", "해서", "있", "하", "되" // Basic Korean particles
  ]);
  
  const wordCount: Record<string, number> = {};
  boards.forEach(b => {
    if (!b.description) return;
    // Split by whitespace and non-word chars, filtering basic punctuation
    const words = b.description.toLowerCase().split(/[\s,.!?()\[\]{}""''`~]+/);
    words.forEach(w => {
      if (w.length > 1 && !stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });

  const commonKeywords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  return {
    counts: {
      totalBoards,
      totalDefinedTags,
      totalUsedTags,
      orphanedTags: orphanedTagsList.length,
    },
    habits: {
      mostActiveDay,
      longestStreak,
      currentStreak,
      activityHeatmap,
      weekendPercentage,
    },
    tags: {
      mostUsed,
      orphaned: orphanedTagsList,
      coOccurrence,
      density,
      topColors,
    },
    content: {
      richEntries,
      avgDescriptionLength,
      commonKeywords,
    },
  };
}

export interface StatHighlight {
  label: string;
  value: string | number;
  icon?: string;
  type?: 'text' | 'color' | 'percentage';
}

export function getRandomHighlights(stats: Statistics): StatHighlight[] {
  const pool: StatHighlight[] = [
    { label: "Most Active Day", value: stats.habits.mostActiveDay },
    { label: "Creation Streak", value: `${stats.habits.longestStreak} days` },
    { label: "Orphaned Tags", value: stats.counts.orphanedTags },
    { label: "Tag Density", value: stats.tags.density.toFixed(1) },
    { label: "Total Boards", value: stats.counts.totalBoards },
    { label: "Defined Tags", value: stats.counts.totalDefinedTags },
    { label: "Rich Entries", value: stats.content.richEntries },
    { label: "Avg Description", value: `${Math.round(stats.content.avgDescriptionLength)} chars` },
    { label: "Weekend Activity", value: `${stats.habits.weekendPercentage}%`, type: 'percentage' },
  ];

  if (stats.content.commonKeywords.length > 0) {
    const word = stats.content.commonKeywords[0];
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    pool.push({ label: "Top Keyword", value: capitalized });
  }
  
  // Only add if we have colors
  // if (stats.tags.topColors.length > 0) {
  //   pool.push({ label: "Favorite Type", value: "Color", type: 'color' }); // Needs UI support
  // }

  // Randomly shuffle and pick 2
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}
