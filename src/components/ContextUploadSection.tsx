import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Tag, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContextUploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    tag: string;
  }>>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type.includes('pdf') ? 'PDF' : 'DOCX',
          tag: 'Support' // Default tag
        }]);
      });
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) added to your context library`,
      });
    }
  };

  const scenarioTypes = ["Support", "Healthcare", "Compliance"];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
              Context Setup
            </h2>
            <p className="text-muted-foreground">
              Upload your guides and protocols to make AI role-play more authentic
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Interface */}
            <Card className="p-8">
              <h3 className="text-xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Documents
              </h3>
              
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center mb-6">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drop files here or click to upload
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Choose Files
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF, DOCX files supported
                </p>
              </div>

              {/* Scenario Tags */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tag by Scenario Type
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scenarioTypes.map(type => (
                    <Badge key={type} variant="secondary" className="cursor-pointer">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Uploaded Files & Help */}
            <div className="space-y-6">
              {/* Uploaded Files */}
              <Card className="p-6">
                <h4 className="font-semibold text-foreground mb-4">
                  Uploaded Guides ({uploadedFiles.length})
                </h4>
                {uploadedFiles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No files uploaded yet</p>
                ) : (
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {file.tag}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Help Tooltip */}
              <Card className="p-6 bg-accent/10 border-accent/20">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      How Context Works
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your uploaded guides feed the AI's "context layer" to enable authentic, 
                      dynamic role-play scenarios. The AI will reference your protocols to 
                      provide realistic responses and targeted feedback.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContextUploadSection;