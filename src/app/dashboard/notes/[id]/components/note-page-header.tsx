import Link from "next/link";
import { Button } from "../../../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { ArrowLeft, Edit3, Eye, EyeOff, History, Save, Trash2 } from "lucide-react";
import { useNotePageContext } from "./note-page-context";

export function NotePageHeader() {
  const {
    note,
    editing,
    canEdit,
    canDelete,
    saving,
    title,
    visibility,
    onEdit,
    onDelete,
    onCancel,
    onSave,
    onVisibilityChange,
  } = useNotePageContext();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/notes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{editing ? "Edit Note" : note.title}</h1>
              {note.visibility === "public" ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && !editing && (
              <>
                <Button variant="outline" onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/notes/${note.id}/versions`}>
                    <History className="h-4 w-4 mr-2" />
                    Versions
                  </Link>
                </Button>
                {canDelete && (
                  <Button variant="outline" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </>
            )}

            {editing && (
              <>
                <Button variant="outline" onClick={onCancel} disabled={saving}>
                  Cancel
                </Button>
                <Select value={visibility} onValueChange={onVisibilityChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center">
                        <EyeOff className="h-4 w-4 mr-2" />
                        Private
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Public
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={onSave} disabled={saving || !title.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
