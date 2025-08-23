
              isMobileMenuOpen={isMobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              onShare={() => setIsShareModalOpen(true)}
              onInstall={handleInstallClick}
              installPrompt={installPrompt}
            />
            
            <div className="md:ml-64 flex flex-col min-h-screen bg-slate-100">
                {page !== 'permission' && (
                    <MobileHeader
                        onMenuClick={() => setMobileMenuOpen(true)}
                        pageTitle={pageTitles[page]}
                    />
                )}
                <main className="flex-1">
                    {page === 'permission' ? (
                        <PermissionScreen onDecision={handlePermissionDecision} />
                    ) : page === 'scan' ? (
                        <div className="h-full">
                            {renderPageContent()}
                        </div>
                    ) : (
                        <div className="w-full p-4 sm:p-6 md:p-8">
                        {renderPageContent()}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
