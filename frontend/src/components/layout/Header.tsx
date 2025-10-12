import { Link } from "react-router-dom";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User } from "lucide-react";
import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";
import { useTurnkeyWallet } from "@/context/TurnkeyWalletProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
	const { handleLogin, authState, user } = useTurnkey();
  const { disconnectWallet } = useTurnkeyWallet();
  const isAuthenticated = authState === AuthState.Authenticated;


  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <VoxCardLogo variant="full" size="md" linkTo="/" colorScheme="primary" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Dashboard
            </Link>
            <Link
              to="/groups"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Savings Groups
            </Link>
            <Link
              to="/community"
              className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans"
            >
              Community
            </Link>
            <Link
              to="/about"
              className="text-vox-secondary hover:text-vox-primary whitespace-nowrap transition-colors font-sans"
            >
              About
            </Link>
            
            {/* Authentication Button/Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">{user?.userName || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.userName || 'User'}</p>
                      <p className="text-xs text-gray-500">Authenticated</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/groups" className="cursor-pointer">
                      My Groups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => disconnectWallet()}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => handleLogin()} className="gradient-bg text-white">
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost">
                  <Menu className="h-6 w-6 text-vox-secondary" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <VoxCardLogo variant="full" size="md" linkTo="/" colorScheme="primary" />
                  </div>

                  <nav className="space-y-4">
                    <Link
                      to="/dashboard"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/groups"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Savings Groups
                    </Link>
                    <Link
                      to="/community"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Community
                    </Link>
                    <Link
                      to="/about"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      About
                    </Link>
                  </nav>

                  <div className="mt-8">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-5 w-5 text-vox-primary" />
                            <span className="font-semibold">{user?.userName || 'User'}</span>
                          </div>
                          <p className="text-xs text-gray-500">Authenticated</p>
                        </div>
                        <Button 
                          onClick={() => disconnectWallet()} 
                          variant="outline" 
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleLogin()} className="w-full gradient-bg text-white">
                        Login
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
