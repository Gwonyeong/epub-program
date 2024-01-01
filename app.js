const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const nodepub = require('nodepub');
const format = require('./sigil/format-text');
const archiver = require('archiver');

const app = express();

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');

// 정적 파일 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')));

// 업로드 폴더 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const uploadDirCoverImage = path.join(__dirname, 'coverImage');

if (!fs.existsSync(uploadDirCoverImage)) {
    fs.mkdirSync(uploadDirCoverImage);
}

const epubUploadDir = path.join(__dirname, 'EPUBs');
if (!fs.existsSync(epubUploadDir)) {
    fs.mkdirSync(epubUploadDir);
}

const storageCoverImage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirCoverImage);
    },
    filename: (req, file, cb) => {
        cb(null, 'cover' + path.extname(file.originalname));
    },
});

// 파일 업로드 미들웨어 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });
const uploadCoverImage = multer({ storage: storageCoverImage });

// 루트 경로
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload/cover', uploadCoverImage.single('cover'), (req, res) => {
    res.send('커버 이미지가 업로드 되었습니다.');
});

const removeDirFiles = async (title) => {
    const removeFiles = (directoryPath) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                // 폴더 읽기 중 오류 발생 시 처리
                console.error('Error reading the directory', err);
                return;
            }

            // 각 파일에 대해 삭제 작업을 수행합니다.
            files.forEach((file) => {
                const filePath = path.join(directoryPath, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        // 파일 삭제 중 오류 발생 시 처리
                        console.error('Error deleting file', filePath, err);
                    } else {
                        console.log('Successfully deleted file', filePath);
                    }
                });
            });
        });
    };

    removeFiles(epubUploadDir);
    removeFiles(uploadDirCoverImage);

    fs.rmSync(`${title}.zip`);
};

// 파일 업로드 핸들러
app.post('/upload', upload.array('epubFile'), async (req, res) => {
    const { title, publisher, author } = req.body;
    try {
        const txtFiles = fs.readdirSync('./uploads');

        const coverImage = glob.sync('./coverImage/*');
        const css = require('./Assets/css');

        const fileContents = txtFiles.reduce((acc, txt) => {
            const file = fs.readFileSync(`./uploads/${txt}`, 'utf-8');
            const fileName = txt.split('.')[0];
            acc.push({ fileName, content: file });
            return acc;
        }, []);

        const output = fs.createWriteStream(`${title}.zip`);
        const arc = archiver('zip', { zlib: { level: 9 } });

        res.setHeader('Content-Type', 'application/zip');

        arc.pipe(output);

        for (const file of fileContents) {
            const metadata = {
                id: 1,
                cover: coverImage[0],
                title,
                author,
                publisher,
                language: 'ko',
            };

            const epub = nodepub.document(metadata);

            epub.addSection(
                file.fileName,
                format.formatTextToEpubContent(file.content),
                true,
                true,
                file.fileName,
            );
            epub.addCSS(css);

            await epub.writeEPUB('EPUBs', file.fileName);

            arc.file(`${__dirname}/EPUBs/` + `${file.fileName}.epub`, {
                name: `${file.fileName}.epub`,
            });
            fs.rmSync(`./uploads/${file.fileName}.txt`);
        }

        await arc.finalize();

        output.on('close', () => {
            console.log('close');
            res.download(`${title}.zip`, 'file');
        });
    } catch (err) {
        console.error(err);
    } finally {
        setTimeout(() => {
            removeDirFiles(title).catch((err) => console.error(err));
        }, 2000);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
