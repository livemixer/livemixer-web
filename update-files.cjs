const fs = require('fs');

// Helper function to safely modify files
function modifyFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
}

// 1. Update konva-canvas.tsx - add screen_capture to pluginIdMap
modifyFile('e:/workspace/livemixer/livemixer-web/src/components/konva-canvas.tsx', [
    {
        search: "media: 'io.livemixer.mediasource',\n      video_input:",
        replace: "media: 'io.livemixer.mediasource',\n      screen_capture: 'io.livemixer.screencapture',\n      video_input:"
    }
]);

// 2. Update property-panel.tsx - add screen_capture to pluginIdMap
modifyFile('e:/workspace/livemixer/livemixer-web/src/components/property-panel.tsx', [
    {
        search: "media: 'io.livemixer.mediasource',\n      video_input:",
        replace: "media: 'io.livemixer.mediasource',\n      screen_capture: 'io.livemixer.screencapture',\n      video_input:"
    }
]);

// 3. Update add-source-dialog.tsx - add screen_capture option
modifyFile('e:/workspace/livemixer/livemixer-web/src/components/add-source-dialog.tsx', [
    {
        search: `icon: <Video className="w-6 h-6" />,
    },
    {
      type: 'text',`,
        replace: `icon: <Video className="w-6 h-6" />,
    },
    {
      type: 'screen_capture',
      name: t('addSource.screenCapture.name'),
      description: t('addSource.screenCapture.description'),
      icon: <Monitor className="w-6 h-6" />,
    },
    {
      type: 'text',`
    }
]);

// 4. Update en.ts - add screenCapture translations
modifyFile('e:/workspace/livemixer/livemixer-web/src/locales/en.ts', [
    {
        search: `description: 'Add a video or audio file',
        },
        text: {`,
        replace: `description: 'Add a video or audio file',
        },
        screenCapture: {
            name: 'Screen Capture',
            description: 'Share your screen or window',
        },
        text: {`
    }
]);

// 5. Update zh.ts - add screenCapture translations
modifyFile('e:/workspace/livemixer/livemixer-web/src/locales/zh.ts', [
    {
        search: `description: '添加视频或音频文件',
        },
        text: {`,
        replace: `description: '添加视频或音频文件',
        },
        screenCapture: {
            name: '屏幕捕获',
            description: '共享您的屏幕或窗口',
        },
        text: {`
    }
]);

console.log('All files updated successfully!');
