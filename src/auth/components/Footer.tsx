const Footer = () => (
  <footer className="py-4 text-center text-gray-500 text-sm">
    <div className="flex justify-center space-x-4 mb-2">
      <a href="/terms" className="hover:text-gray-300">
        Terms
      </a>
      <a href="/privacy" className="hover:text-gray-300">
        Privacy
      </a>
      <a href="/docs" className="hover:text-gray-300">
        Docs
      </a>
      <a href="/support" className="hover:text-gray-300">
        Contact support
      </a>
      <div>
        &copy; {new Date().getFullYear()} FlytBase Inc. All rights reserved
      </div>
    </div>
  </footer>
);

export default Footer;
