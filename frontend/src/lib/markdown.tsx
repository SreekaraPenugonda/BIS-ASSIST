import * as React from "react";

/** Tiny markdown renderer for assistant replies: **bold**, *italic*, - bullets. */

interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function inline(text: string): React.ReactNode {
  const parts: (Segment | string)[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push({ text: token.slice(2, -2), bold: true } as Segment);
    } else {
      parts.push({ text: token.slice(1, -1), italic: true } as Segment);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <React.Fragment key={`s${i}`}>{p}</React.Fragment>
        ) : (
          <React.Fragment key={`s${i}`}>
            <strong>{p.bold ? <>{p.text}</> : null}</strong>
            {p.italic ? <em>{p.text}</em> : null}
          </React.Fragment>
        )
      )}
    </>
  );
}

export function renderMarkdown(source: string): React.ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length) {
      blocks.push(
        <ul key={`ul${key++}`} className="list-disc space-y-1">
          {bulletBuffer.map((b, i) => (
            <li key={i}>{inline(b)}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.slice(2));
      continue;
    }
    flushBullets();
    if (!trimmed) continue;
    if (trimmed.startsWith("### ")) {
      blocks.push(<h4 key={`h${key++}`} className="text-sm font-bold">{inline(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith("## ")) {
      blocks.push(<h3 key={`h${key++}`} className="text-base font-bold">{inline(trimmed.slice(3))}</h3>);
    } else {
      blocks.push(<p key={`p${key++}`}>{inline(trimmed)}</p>);
    }
  }
  flushBullets();
  return <div className="md-body space-y-1.5">{blocks}</div>;
}