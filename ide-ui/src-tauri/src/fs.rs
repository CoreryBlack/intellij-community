/// Mirrors com.intellij.openapi.vfs.VirtualFile / FileDocumentManager
/// Provides filesystem operations for the IDE

use std::path::PathBuf;

#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<DirEntry>, String> {
    let dir = PathBuf::from(&path);
    if !dir.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    let read = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;

    for entry in read {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') && name != ".idea" && name != ".gitignore" && name != ".mvn" {
            continue;
        }
        if name == "target" || name == "node_modules" || name == "dist" || name == "__pycache__" {
            continue;
        }

        entries.push(DirEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_directory: file_type.is_dir(),
            size: if file_type.is_file() {
                entry.metadata().ok().map(|m| m.len()).unwrap_or(0)
            } else {
                0
            },
        });
    }

    entries.sort_by(|a, b| {
        if a.is_directory != b.is_directory {
            if a.is_directory { std::cmp::Ordering::Less } else { std::cmp::Ordering::Greater }
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

#[tauri::command]
pub fn read_file_content(path: String) -> Result<String, String> {
    let file = PathBuf::from(&path);
    if !file.exists() {
        return Err(format!("File not found: {}", path));
    }
    if !file.is_file() {
        return Err(format!("Not a file: {}", path));
    }
    std::fs::read_to_string(&file).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

#[tauri::command]
pub fn is_directory(path: String) -> bool {
    PathBuf::from(&path).is_dir()
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
}
