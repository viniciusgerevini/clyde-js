import {
  Interpreter,
  type DialogueEnd,
  type DialogueLine,
  type DialogueOptions,
  EventType,
} from "@clyde-lang/interpreter";
import { ClydeDocumentRoot, parse } from "@clyde-lang/parser";
import {
  PlayIcon,
  DatabaseBackupIcon,
  FastForwardIcon,
  RotateCcwIcon,
  GhostIcon,
  CircleXIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import "./Player.css";

interface DialogueEvent {
  type: "event";
  text: string;
}

interface DialogueAutoSelection {
  type: "selection";
  content: DialogueOptions;
  selection: number;
}

type DialogueEntry =
  | DialogueEnd
  | DialogueLine
  | DialogueOptions
  | DialogueEvent
  | DialogueAutoSelection;

interface PlayerParams {
  dialogue: string;
}

const variables: Record<string, any> = {};

//@ts-ignore
window.clydeVariables = variables;

export function Player({ dialogue }: PlayerParams) {
  const [entries, setEntries] = useState<DialogueEntry[]>([]);
  const [isWaitingForChoice, setIsWaitingForChoice] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const bottomRef = useRef<null | HTMLDivElement>(null);
  const [parsed, setParsed] = useState<ClydeDocumentRoot>(new ClydeDocumentRoot());
  const [parseError, setParseError] = useState<undefined | string>(undefined);
  const [selectedBlock, setSelectedBlock] = useState("");
  const blocks = useMemo(() => {
    return parsed.blocks.map((b) => b.name);
  }, [parsed.blocks]);

  const interpreter = useMemo(() => {
    return Interpreter(parsed);
  }, [parsed]);

  const resetToDefault = () => {
    setHasEnded(false);
    setIsWaitingForChoice(false);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addToEntries = (entry: DialogueEntry | DialogueEntry[]) => {
    const n = entries.concat(entry);
    setEntries(n);
  };

  const onRestart = () => {
    interpreter.start(selectedBlock);
    setEntries([]);
    resetToDefault();
  };

  const onNext = () => {
    if (isWaitingForChoice || hasEnded) {
      return;
    }
    next();
  };

  const next = () => {
    const content = interpreter.getContent();
    addToEntries(content);
    handleContent(content);
  };

  const handleContent = (content: DialogueEntry) => {
    if (content.type === "options") {
      setIsWaitingForChoice(true);
    } else if (content.type === "end") {
      setHasEnded(true);
    }
  };

  const onForward = () => {
    if (isWaitingForChoice || hasEnded) {
      return;
    }
    let type = "line";
    const newEntries: DialogueEntry[] = [];

    while (type === "line") {
      const content = interpreter.getContent();
      newEntries.push(content);
      handleContent(content);
      type = content.type;
    }
    addToEntries(newEntries);
  };

  const onAutoMode = () => {
    if (hasEnded) {
      return;
    }

    let type = "line";
    const newEntries: DialogueEntry[] = [];

    while (type !== "end") {
      const content = interpreter.getContent();

      if (content.type === "options") {
        const choice = Math.floor(Math.random() * content.options.length);
        interpreter.choose(choice);
        newEntries.push({
          type: "selection",
          content,
          selection: choice,
        });
      } else {
        newEntries.push(content);
      }
      type = content.type;
    }
    addToEntries(newEntries);
    setHasEnded(true);
  };

  const onClearMemory = () => {
    interpreter.clearData();
    interpreter.start();
    resetToDefault();
    setEntries([]);
  };

  const onBlockSelected = (blockName: string) => {
    setSelectedBlock(blockName);
    interpreter.start(blockName);
    resetToDefault();
    addToEntries({
      type: "event",
      text: `Block selected: ${blockName === "" ? "Default" : blockName}`,
    });
  };

  const onOptionSelected = (optionIndex: number) => {
    if (!isWaitingForChoice) {
      return;
    }

    setIsWaitingForChoice(false);
    interpreter.choose(optionIndex);
    next();
  };

  useEffect(() => {
    var t = setTimeout(() => {
      try {
        const p = parse(dialogue);
        setParsed(p);
        setParseError(undefined);
      } catch (e) {
        setParseError((e as any).message);
      }
    }, 300);

    return () => {
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue]);

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  useEffect(() => {
    if (
      !entries.length ||
      entries[entries.length - 1].type !== "event" ||
      (entries[entries.length - 1] as any).text !== "Dialogue Changed"
    ) {
      addToEntries({ type: "event", text: "Dialogue Changed" });
    }
    resetToDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

  useEffect(() => {
    interpreter.onExternalVariableFetch((name: string) => {
      return variables[name];
    });

    interpreter.onExternalVariableUpdate((name: string, value: any) => {
      console.log("external variable updated: ", name, " = ", value);
      variables[name] = value;
    });

    interpreter.on(EventType.EVENT_TRIGGERED, (name: string, parameters: any[]) => {
      console.log("event triggered: ", name, "(", parameters, ")");
    });

    interpreter.on(EventType.VARIABLE_CHANGED, (name: string, value: any) => {
      console.log("variable updated: ", name, " = ", value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interpreter]);

  return (
    <div className="player-container">
      <div className="action-bar">
        <select value={selectedBlock} onChange={(e) => onBlockSelected(e.target.value)}>
          <option value="">Default</option>
          {blocks.map((b) => {
            return (
              <option key={b} value={b}>
                {b}
              </option>
            );
          })}
        </select>
        <button onClick={onRestart} title="Restart dialogue">
          <RotateCcwIcon />
        </button>
        <button onClick={onNext} title="Next line">
          <PlayIcon />
        </button>
        <button onClick={onForward} title="Forward to next option">
          <FastForwardIcon />
        </button>
        <button onClick={onAutoMode} title="Poltergeist (auto-mode)">
          <GhostIcon />
        </button>
        <button onClick={onClearMemory} title="Clear internal memory">
          <DatabaseBackupIcon />
        </button>
      </div>
      <div className="entries" onClick={onNext}>
        {entries.map((e, i) => {
          return <DialogueBubble key={i} content={e} onOptionSelected={onOptionSelected} />;
        })}
        <div ref={bottomRef}></div>
      </div>
      {parseError && (
        <div className="error-message">
          <CircleXIcon size={16} color={"#ff5e00"} /> {parseError}
        </div>
      )}
    </div>
  );
}

function DialogueBubble({
  content,
  onOptionSelected,
  selection = -1,
}: {
  content: DialogueEntry;
  onOptionSelected: (optionIndex: number) => void;
  selection?: number;
}) {
  const [selectedOption, setOptionSelected] = useState(selection);

  if (content.type === "end") {
    return <div className="bubble bubble-end">Dialogue Ended</div>;
  }

  if (content.type === "event") {
    return <div className="bubble bubble-event">{content.text}</div>;
  }

  if (content.type === "selection") {
    return (
      <DialogueBubble
        content={content.content}
        onOptionSelected={onOptionSelected}
        selection={content.selection}
      />
    );
  }

  return (
    <div className="bubble">
      {content.speaker && <div className="speaker">{content.speaker}</div>}
      <div>{content.text}</div>
      {content.type === "options" && (
        <ul>
          {content.options.map((o, i) => {
            return (
              <li key={i}>
                <button
                  className={selectedOption !== i ? "option" : "option-selected"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOptionSelected(i);
                    onOptionSelected(i);
                  }}
                  disabled={selectedOption > -1}
                >
                  {o.text}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {(content.id || content.tags) && (
        <div className="metadata">
          {content.id && `id: ${content.id} `}
          {content.tags && content.tags.map((t) => `#${t} `)}
        </div>
      )}
    </div>
  );
}
