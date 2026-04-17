import { Button } from "../../../../../components/ui/button";
import { Label } from "../../../../../components/ui/label";
import { Sparkles } from "lucide-react";
import { useNotePageContext } from "./note-page-context";

export function AISummaryPanel() {
  const {
    editing,
    note,
    isAuthor,
    summarizing,
    updatingSummary,
    summaryError,
    onGenerateSummary,
    onSummaryDecision,
  } = useNotePageContext();

  if (editing) return null;

  return (
    <div className="space-y-3 border rounded-md p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <Label>AI Summary</Label>
        <Button variant="outline" onClick={onGenerateSummary} disabled={summarizing}>
          <Sparkles className="h-4 w-4 mr-2" />
          {summarizing ? "Generating..." : "Generate Summary"}
        </Button>
      </div>

      {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}

      {note.summary ? (
        <>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{note.summary}</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status: {note.summaryStatus || "pending"}</span>
            {isAuthor && note.summaryStatus === "pending" && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSummaryDecision("reject")}
                  disabled={updatingSummary}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSummaryDecision("accept")}
                  disabled={updatingSummary}
                >
                  Accept
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">No summary generated yet.</p>
      )}
    </div>
  );
}
