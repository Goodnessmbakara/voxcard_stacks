import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";

import { shortenAddress } from "@/services/utils";

export const Header = () => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDisconnect) return;
    function handleClick(event: MouseEvent) {
      if (
        disconnectMenuRef.current &&
        !disconnectMenuRef.current.contains(event.target as Node)
      ) {
        setShowDisconnect(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDisconnect]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <VoxCardLogo variant="full" size="md" linkTo="/" />

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
            
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <VoxCardLogo variant="full" size="md" linkTo="/" />
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

                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
