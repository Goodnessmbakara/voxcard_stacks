import { Link } from "react-router-dom";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTurnkey } from "@turnkey/react-wallet-kit";

export const Header = () => {
	const { handleLogin } = useTurnkey();


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
            <Button onClick={() => handleLogin()} className="gradient-bg text-white">Login</Button>
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
                    <Button onClick={() => handleLogin()} className="w-full gradient-bg text-white">Login</Button>
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
