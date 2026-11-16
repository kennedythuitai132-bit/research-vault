"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<any>(null);
  const [errorType, setErrorType] = useState<'expired' | 'network' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchShare = async () => {
    setErrorType(null);
    setErrorMessage("");
    setData(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorType('expired');
        setErrorMessage(err.message || "This link is invalid or has expired.");
        return;
      }
      setData(await res.json());
    } catch (err: any) {
      // Network error (backend down, no internet, CORS, etc.)
      setErrorType('network');
      setErrorMessage("Could not connect to the server. Please check your connection and try again.");
    }
  };

  useEffect(() => {
    if (token) fetchShare();
  }, [token]);

  if (errorType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center space-y-4">
          <h1 className={`text-2xl font-bold ${errorType === 'network' ? 'text-orange-600' : 'text-red-600'}`}>
            {errorType === 'network' ? 'Connection Error' : 'Link Unavailable'}
          </h1>
          <p className="text-gray-600">{errorMessage}</p>
          {errorType === 'network' && (
            <Button onClick={fetchShare} className="w-full">Retry</Button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Shared Research File</h1>
          <p className="text-sm text-gray-500 mt-2">Someone has securely shared a file with you via Research Vault.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">{data.name}</p>
          <p className="text-xs text-gray-500 mt-1">{(Number(data.sizeBytes) / 1024).toFixed(1)} KB</p>
        </div>

        <a href={data.downloadUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
          <Button className="w-full h-12 text-lg">Download File</Button>
        </a>
        
        <p className="text-xs text-center text-gray-400">
          This link will expire on {new Date(data.expiresAt).toLocaleString()}.
        </p>
      </div>
    </div>
  );
}