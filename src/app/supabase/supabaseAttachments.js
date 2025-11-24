import { supabaseClient } from "@/app/supabase/supabaseClient";

/**
 * Upload attachment for a specific note
 */
export const uploadAttachment = async (noteId, file) => {
  try {
    if (!file) {
      alert("No file selected");
      return;
    }

    // Unique file location inside bucket
    const filePath = `${noteId}/${Date.now()}-${file.name}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from("notes-attachment")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Failed to upload file");
      return;
    }

    // Get logged-in user
    const { data: userData } = await supabaseClient.auth.getUser();

    // Save metadata in note_attachments table
    const { data, error: insertError } = await supabaseClient
      .from("note_attachments")
      .insert({
        note_id: noteId,
        filename: file.name,
        path: filePath,
        uploaded_by: userData?.user?.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      alert("Failed to save attachment info");
      return;
    }

    return data; // return new attachment row
  } catch (err) {
    console.error("Unexpected upload error:", err);
  }
};


/**
 * Download attachment from Supabase Storage
 */
export const downloadAttachment = async (path, filename) => {
  try {
    const { data, error } = await supabaseClient.storage
      .from("notes-attachment")
      .download(path);

    if (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
      return;
    }

    // Convert Blob → Download
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Unexpected download error:", err);
  }
};
export const deleteAttachment = async (attachmentId, path) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabaseClient.storage
      .from("notes-attachment")
      .remove([path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      alert("Failed to delete file from storage");
      return false;
    }

    // Delete from table
    const { error: dbError } = await supabaseClient
      .from("note_attachments")
      .delete()
      .eq("id", attachmentId);

    if (dbError) {
      console.error("DB delete error:", dbError);
      alert("Failed to delete attachment record");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected delete error:", err);
    return false;
  }
};


export const getPublicUrl = (path) => {
  const { data } = supabaseClient.storage
    .from("notes-attachment")
    .getPublicUrl(path);

  return data.publicUrl;
};
