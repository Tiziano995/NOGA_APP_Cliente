#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface NogaAppDelegate : NSObject <NSApplicationDelegate, NSWindowDelegate, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler>
@property (strong, nonatomic) NSWindow *window;
@property (strong, nonatomic) WKWebView *webView;
@property (copy, nonatomic) NSString *targetPathOrUrl;
@property (copy, nonatomic) NSString *persistentJsonPath;
@end

@implementation NogaAppDelegate

- (void)setupMenuBar {
    NSMenu *menubar = [[NSMenu alloc] init];
    NSMenuItem *appMenuItem = [[NSMenuItem alloc] init];
    [menubar addItem:appMenuItem];
    [NSApp setMainMenu:menubar];

    NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"NOGA Gestionale"];
    NSMenuItem *quitItem = [[NSMenuItem alloc] initWithTitle:@"Esci da NOGA Gestionale"
                                                      action:@selector(terminate:)
                                               keyEquivalent:@"q"];
    [appMenu addItem:quitItem];
    [appMenuItem setSubmenu:appMenu];

    NSMenuItem *editMenuItem = [[NSMenuItem alloc] init];
    [menubar addItem:editMenuItem];
    NSMenu *editMenu = [[NSMenu alloc] initWithTitle:@"Modifica"];
    [editMenu addItemWithTitle:@"Annulla" action:@selector(undo:) keyEquivalent:@"z"];
    [editMenu addItemWithTitle:@"Ripristina" action:@selector(redo:) keyEquivalent:@"Z"];
    [editMenu addItem:[NSMenuItem separatorItem]];
    [editMenu addItemWithTitle:@"Taglia" action:@selector(cut:) keyEquivalent:@"x"];
    [editMenu addItemWithTitle:@"Copia" action:@selector(copy:) keyEquivalent:@"c"];
    [editMenu addItemWithTitle:@"Incolla" action:@selector(paste:) keyEquivalent:@"v"];
    [editMenu addItemWithTitle:@"Seleziona tutto" action:@selector(selectAll:) keyEquivalent:@"a"];
    [editMenuItem setSubmenu:editMenu];
}

- (void)aggiornaUserScriptSuController:(WKUserContentController *)controller conJson:(NSString *)jsonStr {
    if (!controller || !jsonStr || [jsonStr length] < 2) return;
    [controller removeAllUserScripts];
    NSString *jsSource = [NSString stringWithFormat:@"window.__NOGA_DISK_DB__ = %@;", jsonStr];
    WKUserScript *diskScript = [[WKUserScript alloc] initWithSource:jsSource
                                                      injectionTime:WKUserScriptInjectionTimeAtDocumentStart
                                                   forMainFrameOnly:NO];
    [controller addUserScript:diskScript];
}

- (void)ripristinaDatiDaDiscoNelWebView:(NSNotification *)note {
    if (!self.webView || !self.persistentJsonPath) return;
    if ([[NSFileManager defaultManager] fileExistsAtPath:self.persistentJsonPath]) {
        NSString *savedJson = [NSString stringWithContentsOfFile:self.persistentJsonPath
                                                        encoding:NSUTF8StringEncoding
                                                           error:nil];
        if (savedJson && [savedJson length] >= 2) {
            [self aggiornaUserScriptSuController:self.webView.configuration.userContentController conJson:savedJson];
            NSString *jsCall = [NSString stringWithFormat:@"window.__NOGA_DISK_DB__ = %@; if (window.__nogaRipristinaDaDisco) { window.__nogaRipristinaDaDisco(%@); }", savedJson, savedJson];
            [self.webView evaluateJavaScript:jsCall completionHandler:nil];
        }
    }
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    [self setupMenuBar];

    // Imposta l'icona ufficiale "N-G" NOGA ROMA nel Dock e nella finestra
    NSString *appDir = [[self.targetPathOrUrl stringByDeletingLastPathComponent] stringByDeletingLastPathComponent];
    NSString *icnsPath = [appDir stringByAppendingPathComponent:@"AppIcon.icns"];
    if ([[NSFileManager defaultManager] fileExistsAtPath:icnsPath]) {
        NSImage *iconImg = [[NSImage alloc] initWithContentsOfFile:icnsPath];
        if (iconImg) {
            [NSApp setApplicationIconImage:iconImg];
        }
    }

    NSRect screenFrame = [[NSScreen mainScreen] visibleFrame];
    CGFloat width = MIN(1480.0, screenFrame.size.width * 0.94);
    CGFloat height = MIN(920.0, screenFrame.size.height * 0.92);
    NSRect windowRect = NSMakeRect(
        screenFrame.origin.x + (screenFrame.size.width - width) / 2.0,
        screenFrame.origin.y + (screenFrame.size.height - height) / 2.0,
        width,
        height
    );

    NSUInteger style = NSWindowStyleMaskTitled |
                       NSWindowStyleMaskClosable |
                       NSWindowStyleMaskMiniaturizable |
                       NSWindowStyleMaskResizable;

    self.window = [[NSWindow alloc] initWithContentRect:windowRect
                                              styleMask:style
                                                backing:NSBackingStoreBuffered
                                                  defer:NO];
    [self.window setTitle:@"NOGA ROMA — Gestionale Acquisizione Clienti B2B"];
    [self.window setMinSize:NSMakeSize(1024, 680)];
    [self.window setBackgroundColor:[NSColor colorWithSRGBRed:0.973 green:0.969 blue:0.961 alpha:1.0]];
    [self.window setDelegate:self];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.preferences.javaScriptCanOpenWindowsAutomatically = YES;
    @try {
        [config.preferences setValue:@YES forKey:@"allowFileAccessFromFileURLs"];
    } @catch (NSException *exception) {}

    // Registra il canale di salvataggio persistente su disco
    [config.userContentController addScriptMessageHandler:self name:@"nogaSaveDisk"];

    // Carica i dati salvati su disco in ~/Library/Application Support/NOGA_Gestionale/noga_dati_persistenti.json
    if (self.persistentJsonPath && [[NSFileManager defaultManager] fileExistsAtPath:self.persistentJsonPath]) {
        NSString *savedJson = [NSString stringWithContentsOfFile:self.persistentJsonPath
                                                        encoding:NSUTF8StringEncoding
                                                           error:nil];
        if (savedJson && [savedJson length] >= 2) {
            [self aggiornaUserScriptSuController:config.userContentController conJson:savedJson];
        }
    }

    self.webView = [[WKWebView alloc] initWithFrame:[[self.window contentView] bounds]
                                      configuration:config];
    [self.webView setAutoresizingMask:(NSViewWidthSizable | NSViewHeightSizable)];
    [self.webView setUIDelegate:self];
    [self.webView setNavigationDelegate:self];

    [[self.window contentView] addSubview:self.webView];

    // Ascolta il risveglio dallo standby del Mac e il ritorno in primo piano dell'app
    [[[NSWorkspace sharedWorkspace] notificationCenter] addObserver:self
                                                           selector:@selector(ripristinaDatiDaDiscoNelWebView:)
                                                               name:NSWorkspaceDidWakeNotification
                                                             object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(ripristinaDatiDaDiscoNelWebView:)
                                                 name:NSApplicationDidBecomeActiveNotification
                                               object:nil];

    if ([self.targetPathOrUrl hasPrefix:@"http://"] || [self.targetPathOrUrl hasPrefix:@"https://"]) {
        NSURL *url = [NSURL URLWithString:self.targetPathOrUrl];
        NSURLRequest *req = [NSURLRequest requestWithURL:url];
        [self.webView loadRequest:req];
    } else {
        NSURL *fileURL = [NSURL fileURLWithPath:self.targetPathOrUrl];
        NSURL *readDirURL = [fileURL URLByDeletingLastPathComponent];
        [self.webView loadFileURL:fileURL allowingReadAccessToURL:readDirURL];
    }

    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.name isEqualToString:@"nogaSaveDisk"]) {
        NSString *jsonStr = nil;
        if ([message.body isKindOfClass:[NSString class]]) {
            jsonStr = (NSString *)message.body;
        } else if (message.body) {
            jsonStr = [NSString stringWithFormat:@"%@", message.body];
        }
        if (self.persistentJsonPath && jsonStr && [jsonStr length] >= 2) {
            [jsonStr writeToFile:self.persistentJsonPath
                      atomically:YES
                        encoding:NSUTF8StringEncoding
                           error:nil];
            [self aggiornaUserScriptSuController:userContentController conJson:jsonStr];
        }
    }
}

- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView {
    if (self.persistentJsonPath && [[NSFileManager defaultManager] fileExistsAtPath:self.persistentJsonPath]) {
        NSString *savedJson = [NSString stringWithContentsOfFile:self.persistentJsonPath
                                                        encoding:NSUTF8StringEncoding
                                                           error:nil];
        if (savedJson && [savedJson length] >= 2) {
            [self aggiornaUserScriptSuController:webView.configuration.userContentController conJson:savedJson];
        }
    }
    [webView reload];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return YES;
}

- (void)webView:(WKWebView *)webView
runJavaScriptAlertPanelWithMessage:(NSString *)message
initiatedByFrame:(WKFrameInfo *)frame
completionHandler:(void (^)(void))completionHandler {
    NSAlert *alert = [[NSAlert alloc] init];
    [alert setMessageText:@"NOGA ROMA"];
    [alert setInformativeText:message ?: @""];
    [alert addButtonWithTitle:@"OK"];
    [alert runModal];
    completionHandler();
}

- (void)webView:(WKWebView *)webView
runJavaScriptConfirmPanelWithMessage:(NSString *)message
initiatedByFrame:(WKFrameInfo *)frame
completionHandler:(void (^)(BOOL result))completionHandler {
    NSAlert *alert = [[NSAlert alloc] init];
    [alert setMessageText:@"Conferma Operazione — NOGA ROMA"];
    [alert setInformativeText:message ?: @""];
    [alert addButtonWithTitle:@"Conferma"];
    [alert addButtonWithTitle:@"Annulla"];
    NSModalResponse resp = [alert runModal];
    completionHandler(resp == NSAlertFirstButtonReturn);
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];

        NSString *supportDir = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Application Support/NOGA_Gestionale"];
        [[NSFileManager defaultManager] createDirectoryAtPath:supportDir
                                  withIntermediateDirectories:YES
                                                   attributes:nil
                                                        error:nil];

        NogaAppDelegate *delegate = [[NogaAppDelegate alloc] init];
        delegate.persistentJsonPath = [supportDir stringByAppendingPathComponent:@"noga_dati_persistenti.json"];

        if (argc > 1) {
            delegate.targetPathOrUrl = [NSString stringWithUTF8String:argv[1]];
        } else {
            NSString *execPath = [[NSBundle mainBundle] executablePath];
            NSString *contentsDir = [[execPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent];
            delegate.targetPathOrUrl = [contentsDir stringByAppendingPathComponent:@"Resources/app/app_nativa_mac.html"];
        }

        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
