import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import StarryBackground from '../components/StarryBackground';

interface FAQProps {
  content: string;
}

export default function FAQ({ content }: FAQProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      <StarryBackground show={true} />
      <div className="flex-grow flex flex-col relative z-10 overflow-auto">
        <div className="bg-white dark:bg-transparent p-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <span className="text-gray-900 dark:text-white hover:underline cursor-pointer">
                ← Back to Home
              </span>
            </Link>
            <div className="flex space-x-2">
              <ThemeToggle />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
        </div>
        <div className="flex-grow bg-white dark:bg-transparent faq-content">
          <div className="prose dark:prose-invert max-w-none p-8">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const filePath = path.join(process.cwd(), 'public', 'faq.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { content } = matter(fileContents);

  return {
    props: {
      content,
    },
  };
};
