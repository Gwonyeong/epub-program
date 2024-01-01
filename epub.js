const baseEpub = (title, body) => {
    const base = `
                <?xml version="1.0" encoding="utf-8" standalone="no"?>
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
            "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
            
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:xml="http://www.w3.org/XML/1998/namespace" xml:lang="ko">
            <head>
            <title>${title}</title>
            <link href="../Styles/Style.css" rel="stylesheet" type="text/css" />
            </head>
            
            <body>
            ${body}
            </body>
            </html>
            
                `

    return base

}

module.exports = {baseEpub}

