import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const XANO_BASE_URL = process.env.XANO_BASE_URL || "https://x8ki-letl-twmt.n7.xano.io/api:7hR2kBB5";
const BATCH_SIZE_LIMIT = 50;

interface MoveRequest {
  fileIds: number[];
  folderId: number | null;
}

interface MoveResult {
  success: boolean;
  fileId: number;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Move a single file to a folder
async function moveFileToFolder(fileId: number, folderId: number | null): Promise<MoveResult> {
  try {
    console.log(`Moving file ${fileId} to folder ${folderId}`);
    
    const response = await fetch(`${XANO_BASE_URL}/asset/${fileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folder_id: folderId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to move file ${fileId}:`, errorText);
      return {
        success: false,
        fileId,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(`Successfully moved file ${fileId}`);
    
    return {
      success: true,
      fileId,
    };
  } catch (error) {
    console.error(`Error moving file ${fileId}:`, error);
    return {
      success: false,
      fileId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Validate folder exists (if folderId is provided)
async function validateFolder(folderId: number | null): Promise<boolean> {
  if (folderId === null) {
    return true; // Moving to root is always valid
  }

  try {
    const response = await fetch(`${XANO_BASE_URL}/folder`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch folders for validation");
      return false;
    }

    const folders = await response.json();
    const folderExists = folders.some((folder: any) => folder.id === folderId);
    
    if (!folderExists) {
      console.error(`Folder ${folderId} does not exist`);
    }
    
    return folderExists;
  } catch (error) {
    console.error("Error validating folder:", error);
    return false;
  }
}

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { fileIds, folderId }: MoveRequest = JSON.parse(event.body);

    // Validate input
    if (!Array.isArray(fileIds)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "fileIds must be an array" }),
      };
    }

    if (fileIds.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "fileIds array cannot be empty" }),
      };
    }

    if (fileIds.length > BATCH_SIZE_LIMIT) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Batch size exceeds limit of ${BATCH_SIZE_LIMIT} items`,
        }),
      };
    }

    // Validate all fileIds are numbers
    if (!fileIds.every((id) => typeof id === "number" && id > 0)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "All fileIds must be positive numbers" }),
      };
    }

    // Validate folderId
    if (folderId !== null && (typeof folderId !== "number" || folderId <= 0)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "folderId must be a positive number or null" }),
      };
    }

    console.log(`Processing batch move: ${fileIds.length} files to folder ${folderId}`);

    // Validate folder exists
    const folderValid = await validateFolder(folderId);
    if (!folderValid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid folder ID" }),
      };
    }

    // Process all moves in parallel
    const movePromises = fileIds.map((fileId) => moveFileToFolder(fileId, folderId));
    const results = await Promise.allSettled(movePromises);

    // Collect results
    const moveResults: MoveResult[] = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          fileId: fileIds[index],
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    // Calculate statistics
    const successCount = moveResults.filter((r) => r.success).length;
    const failureCount = moveResults.filter((r) => !r.success).length;

    console.log(`Batch move complete: ${successCount} succeeded, ${failureCount} failed`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        total: fileIds.length,
        succeeded: successCount,
        failed: failureCount,
        results: moveResults,
      }),
    };
  } catch (error) {
    console.error("Batch move error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};