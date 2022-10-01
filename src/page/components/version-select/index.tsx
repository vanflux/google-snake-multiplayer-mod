import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "react-query"
import { githubService, ReleaseItem } from "../../services/github-service"
import { MenuSelect } from "../menu-select";

export interface VersionSelectProps {
  tag?: string;
  onChange?: (tag?: string) => void;
}

export function VersionSelect({tag, onChange}: VersionSelectProps) {
  const { isLoading, error, data } = useQuery(['releases'], githubService.fetchReleases, {
    select: data => data.sort((a, b) => b.tag_name.localeCompare(a.tag_name)),
  });

  const getName = (item: ReleaseItem) => {
    if (item.tag_name.match(/0\.[1-5]\.\d+/)) return `${item.tag_name} (No version manager)`;
    return item.tag_name;
  };

  useEffect(() => {
    if (tag === undefined && data && data.length > 0) {
      const thisItem = data.find(item => item.tag_name.match(VERSION));
      if (thisItem) return onChange?.(thisItem.tag_name);
    }
  }, [data]);

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>{`An error has occurred: ${error}`}</span>;

  return <MenuSelect
    onChange={newTag => onChange?.(newTag)}
    value={tag}
    items={data?.map(item => ({ name: getName(item), data: item.tag_name }))}
  />;
}
