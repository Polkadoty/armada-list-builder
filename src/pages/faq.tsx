import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { SettingsButton } from '../components/SettingsButton';
import StarryBackground from '../components/StarryBackground';

interface FAQProps {
  content: string;
}

export default function FAQ({ content }: FAQProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground show={true} />
      <div className="bg-white dark:bg-transparent p-8 flex-grow relative z-10">
        <div className="flex justify-between items-center mb-4">
          <Link href="/">
            <span className="text-gray-900 dark:text-white hover:underline cursor-pointer">
              ← Back to Home
            </span>
          </Link>
          <div className="flex space-x-2">
            <SettingsButton 
              setIsLoading={() => {}}
              setLoadingProgress={() => {}}
              setLoadingMessage={() => {}}
            />
            <ThemeToggle />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
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
