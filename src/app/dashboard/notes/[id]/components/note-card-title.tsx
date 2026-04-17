import { Avatar, AvatarFallback } from "../../../../../components/ui/avatar";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { CardTitle } from "../../../../../components/ui/card";
import { useNotePageContext } from "./note-page-context";

export function NoteCardTitle() {
  const { editing, note, title, onTitleChange } = useNotePageContext();

  if (editing) {
    return (
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter note title..."
          className="text-xl font-semibold"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <CardTitle className="text-2xl">{note.title}</CardTitle>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {note.author?.fullName?.charAt(0) || note.author?.email?.charAt(0).toUpperCase() || "N"}
          </AvatarFallback>
        </Avatar>
        <span>{note.author?.fullName || note.author?.email || "Unknown Author"}</span>
        <span>•</span>
        <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
