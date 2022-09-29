import React from "react";
import { useQuery } from "react-query"
import { githubService } from "../../services/github-service"
import { MenuSelect } from "../menu-select";

export function VersionSelect() {
  const { isLoading, error, data } = useQuery(['releases'], githubService.fetchReleases);
  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>{`An error has occurred: ${error}`}</span>;
  return <MenuSelect></MenuSelect>;
}
