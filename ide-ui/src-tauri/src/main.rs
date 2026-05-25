// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    std::thread::Builder::new()
        .stack_size(8 * 1024 * 1024)
        .name("ide-main".into())
        .spawn(|| {
            intellij_ide_lib::run()
        })
        .unwrap()
        .join()
        .unwrap();
}
