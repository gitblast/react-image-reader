import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Link,
  Progress,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useClipboard,
  useConst,
  useMediaQuery,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";

import { createWorker, Page } from "tesseract.js";

const useWorker = () => {
  const [progress, setProgress] = useState(0);
  const [lang] = useState("eng");
  const [error, setError] = useState<Error | null>(null);

  const worker = useConst(() => {
    return createWorker({
      logger: (m) => {
        if (m?.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
      },
      errorHandler: (e) => {
        setError(e);
      },
    });
  });

  useEffect(() => {
    const init = async () => {
      await worker.load();
      await worker.loadLanguage(lang);
      await worker.initialize(lang);
    };

    init();
  }, [lang, worker]);

  const clearError = React.useCallback(() => setError(null), []);

  return { progress, setProgress, worker, error, clearError };
};

const useObjectURL = (img: File | null) => {
  const [objUrl, setObjUrl] = useState<string | null>(null);

  useEffect(() => {
    if (img) {
      const url = URL.createObjectURL(img);

      setObjUrl(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setObjUrl(null);
    }
  }, [img]);

  return objUrl;
};

function App() {
  const { worker, progress, error, clearError } = useWorker();
  const [ocr, setOcr] = useState<Page | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 768px)");

  const objUrl = useObjectURL(image);

  const loaderRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = async () => {
      setLoading(true);

      loaderRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

      try {
        const { data } = await worker.recognize(image);

        clearError();

        setOcr(data);
      } catch {}

      setLoading(false);
    };

    if (image) {
      read();
    }
  }, [image, worker, clearError]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { hasCopied, onCopy } = useClipboard(ocr?.text ?? "");

  return (
    <Box
      width="100vw"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={3}
    >
      <Box
        display="flex"
        flexDir="column"
        maxW={500}
        bg="gray.900"
        p={isMobile ? 3 : 5}
        mt={isMobile ? 0 : 10}
        borderRadius={isMobile ? 0 : 10}
        gap={5}
        flex={isMobile ? 1 : 0}
      >
        <Box display="flex" flexDir="column" gap={5} pt={isMobile ? 3 : 0}>
          <Heading as="h1" fontSize="2xl">
            Image To Text
          </Heading>
          <Text>
            A free image to text converter using Optical Character Recognition
            (OCR).
          </Text>
          <Button onClick={handleClick}>Select an image to convert</Button>

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageChange}
            display="none"
          />
        </Box>
        {error ? (
          <Alert
            borderRadius={5}
            p={5}
            status="error"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={2}
          >
            <AlertIcon />
            <AlertTitle>Error reading image</AlertTitle>
            <AlertDescription>
              Make sure the image format is supported.
            </AlertDescription>
          </Alert>
        ) : (
          <Flex
            direction="column"
            bg="gray.800"
            overflow="hidden"
            gap={5}
            borderRadius={5}
            ref={loaderRef}
          >
            {objUrl && <Image maxH={300} objectFit="contain" src={objUrl} />}
            {loading ? (
              <Progress mx={5} mb={5} value={progress} borderRadius={2} />
            ) : ocr ? (
              <>
                <Flex mx={5} justify="space-between">
                  <StatGroup flexWrap="nowrap" gap={isMobile ? 4 : 5}>
                    <Stat size="sm">
                      <StatLabel fontSize="sm">Words</StatLabel>
                      <StatNumber>{ocr.words.length}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="sm">Lines</StatLabel>
                      <StatNumber>{ocr.lines.length}</StatNumber>
                    </Stat>
                    <Tooltip label="The degree to which the OCR engine is certain it has recognized the component correctly.">
                      <Stat size="sm">
                        <StatLabel fontSize="sm">Confidence</StatLabel>
                        <StatNumber>{ocr.confidence}%</StatNumber>
                      </Stat>
                    </Tooltip>
                  </StatGroup>
                  <Button onClick={onCopy} size="sm" variant="outline">
                    {hasCopied ? "Copied" : "Copy"}
                  </Button>
                </Flex>
                <Text
                  px={isMobile ? 3 : 5}
                  mb={5}
                  maxH={isMobile ? "none" : 500}
                  overflow="auto"
                  fontSize="md"
                >
                  {ocr.text}
                </Text>
              </>
            ) : (
              <Flex
                flex={1}
                flexDirection="column"
                textAlign="center"
                color="whiteAlpha.300"
                p={10}
                gap={5}
              >
                <Text fontSize="medium">
                  You can take a photo or use an existing one from your device.
                </Text>
                <Flex direction="column" gap={2}>
                  <Text fontWeight="bold" fontSize="sm">
                    Supported image formats:
                  </Text>
                  <Text fontSize="sm">BMP, PNM, PNG, JFIF, JPEG, and TIFF</Text>
                </Flex>
                <Text fontSize={"xs"}>
                  Powered by{" "}
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/naptha/tesseract.js/"
                    color="whiteAlpha.600"
                  >
                    tesseract.js
                  </Link>
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
}

export default App;
