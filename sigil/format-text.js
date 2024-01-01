const formatTextToEpubContent = (text) => {
    const textSplit = text.split('\r\n');

    const result = textSplit.reduce((acc, text) => {
        if (text[0] === '#') {
            acc.push(
                ` <h2 class="sigil_not_in_toc">#<span style="text-indent: 1em;">${text.replace(
                    '#',
                    '',
                )}</span></h2>
                
                <h2 class="sigil_not_in_toc"><br /></h2>
                `,
            );
        } else if (!text) {
            acc.push(` <p><br /></p>`);
        } else {
            acc.push(`<p>${text}</p>`);
        }
        return acc;
    }, []);

    return result.join('\n');
};

module.exports = {
    formatTextToEpubContent,
};
