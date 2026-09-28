"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPollItemsAction,
  getPollSubitemsAction,
  votePollAction,
} from "@/lib/actions/poll";

export function usePollSubjects() {
  return useQuery({
    queryKey: ["pollSubjects"],
    queryFn: async () => {
      return await getPollItemsAction();
    },
  });
}

export function usePollSubitems(itemId: string, paper?: string) {
  return useQuery({
    queryKey: ["pollSubitems", itemId, paper],
    queryFn: async () => {
      if (!itemId) return [];
      return await getPollSubitemsAction(itemId, paper);
    },
    enabled: Boolean(itemId),
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      pollId: string;
      pollOptionId: string;
      userId: string;
    }) => votePollAction(vars.pollId, vars.pollOptionId, vars.userId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["poll", vars.pollId] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });
}
