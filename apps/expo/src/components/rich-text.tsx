import { Fragment } from "react";
import { Linking, Text } from "react-native";
import { useRouter } from "expo-router";
import { RichText as RichTextHelper } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";

interface Props {
  value: string;
  size?: "sm" | "base" | "lg";
}

export const RichText = ({ value, size = "base" }: Props) => {
  const agent = useAuthedAgent();
  const router = useRouter();

  const { data: segments } = useQuery({
    queryKey: ["richtext", value],
    queryFn: async () => {
      const rt = new RichTextHelper({ text: value });
      await rt.detectFacets(agent);
      const parts = [];
      for (const segment of rt.segments()) {
        if (segment.isLink()) {
          parts.push({
            text: segment.text,
            component: (
              <Text
                className="text-blue-500"
                onPress={(evt) => {
                  evt.stopPropagation();
                  void Linking.openURL(segment.link!.uri);
                }}
              >
                {segment.text}
              </Text>
            ),
          });
        } else if (segment.isMention()) {
          parts.push({
            text: segment.text,
            component: (
              <Text
                className="text-blue-500"
                onPress={(evt) => {
                  evt.stopPropagation();
                  router.push(`/profile/${segment.mention!.did}`);
                }}
              >
                {segment.text}
              </Text>
            ),
          });
        } else {
          parts.push({
            text: segment.text,
            component: segment.text,
          });
        }
      }
      return parts;
    },
  });

  if (!segments) return null;

  return (
    <Text
      className={cx("text-base", {
        "text-sm": size === "sm",
        "text-lg leading-6": size === "lg",
      })}
    >
      {segments.map(({ text, component }, i) => (
        <Fragment key={`${i}+${text}`}>{component}</Fragment>
      ))}
    </Text>
  );
};