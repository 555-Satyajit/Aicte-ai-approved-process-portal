import React from 'react';
import { HelpCircle, Book, MessageCircle, ExternalLink } from 'lucide-react';

const HelpAndSupport = () => {
  const helpResources = [
    { title: 'Documentation', icon: Book, link: '#' },
    { title: 'FAQs', icon: HelpCircle, link: '#' },
    { title: 'Contact Support', icon: MessageCircle, link: '#' },
  ];

  return (
    <div className="help-support">
      <h2 className="text-2xl font-bold mb-4">Help and Support</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {helpResources.map((resource, index) => (
          <a
            key={index}
            href={resource.link}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
          >
            <resource.icon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
            <p className="text-sm text-gray-600">Click to access {resource.title.toLowerCase()}</p>
            <ExternalLink className="w-4 h-4 mt-2 text-gray-400" />
          </a>
        ))}
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Need Additional Help?</h3>
        <p className="mb-4">If you can't find the answer you're looking for, our support team is here to help.</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center">
          <MessageCircle className="w-4 h-4 mr-2" />
          Open Support Ticket
        </button>
      </div>
    </div>
  );
};

export default HelpAndSupport;