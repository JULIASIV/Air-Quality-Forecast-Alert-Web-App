import { Satellite } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Satellite className="w-6 h-6" />
              <span className="text-xl font-bold">TEMPO Air</span>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Protecting public health through intelligent air quality forecasting powered by NASA satellite technology.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Project</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Data Sources</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Methodology</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">API Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">NASA TEMPO</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Air Quality Guide</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Health Recommendations</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Research Papers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Partnerships</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Feedback</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>© 2024 NASA Space Apps Challenge. Built with data from NASA TEMPO, OpenAQ, and partner networks.</p>
          <p className="mt-2">This is a demonstration project created for the NASA Space Apps Challenge 2024.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;