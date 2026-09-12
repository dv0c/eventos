import { useCallback, useState } from "react";

import {
  createEmptyStory,
  type StoryDocument,
} from "@/lib/story/types";

const MAX_HISTORY = 40;

export function useStoryHistory(initial?: StoryDocument) {
  const [past, setPast] = useState<StoryDocument[]>([]);
  const [present, setPresent] = useState<StoryDocument>(
    () => initial ?? createEmptyStory(),
  );
  const [future, setFuture] = useState<StoryDocument[]>([]);

  const push = useCallback((next: StoryDocument) => {
    setPast((prev) => {
      const stack = [...prev, present];
      return stack.length > MAX_HISTORY ? stack.slice(-MAX_HISTORY) : stack;
    });
    setPresent(next);
    setFuture([]);
  }, [present]);

  const replace = useCallback((next: StoryDocument) => {
    setPresent(next);
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1]!;
      setFuture((f) => [present, ...f]);
      setPresent(previous);
      return prev.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((next) => {
      if (next.length === 0) return next;
      const [head, ...rest] = next;
      setPast((p) => [...p, present]);
      setPresent(head!);
      return rest;
    });
  }, [present]);

  const commit = useCallback((from: StoryDocument, to: StoryDocument) => {
    setPast((prev) => {
      const stack = [...prev, from];
      return stack.length > MAX_HISTORY ? stack.slice(-MAX_HISTORY) : stack;
    });
    setPresent(to);
    setFuture([]);
  }, []);

  const reset = useCallback((doc?: StoryDocument) => {
    setPast([]);
    setFuture([]);
    setPresent(doc ?? createEmptyStory());
  }, []);

  return {
    doc: present,
    push,
    replace,
    commit,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
