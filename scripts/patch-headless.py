import io

p = r"C:\Users\Administrator\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-headless\lib\index.js"
with io.open(p, "r", encoding="utf-8") as f:
    c = f.read()

anchor = 'agent.followup(createUserMessage({\n\t\tcontent: [{\n\t\t\ttype: "text",\n\t\t\ttext: task\n\t\t}],\n\t\tsource: { kind: "user" }\n\t}));\n\tawait agent.whenIdle();'

injection = 'agent.followup(createUserMessage({\n\t\tcontent: [{\n\t\t\ttype: "text",\n\t\t\ttext: task\n\t\t}],\n\t\tsource: { kind: "user" }\n\t}));\n\tctx.on("session/event", (session, event) => {\n\t\tif (event.seq <= firstSeq) return;\n\t\tif (event.type === "tool/call") {\n\t\t\tconst { name: toolName, arguments: rawArgs } = event.data;\n\t\t\tlet preview = "";\n\t\t\ttry {\n\t\t\t\tconst parsed = JSON.parse(rawArgs);\n\t\t\t\tpreview = parsed.command ?? parsed.path ?? parsed.file_path ?? parsed.description ?? "";\n\t\t\t\tif (typeof preview !== "string") preview = JSON.stringify(preview);\n\t\t\t} catch {}\n\t\t\tio.stderr.write("\\n⚙  " + toolName + (preview ? ": " + String(preview).slice(0, 200) : "") + "\\n");\n\t\t}\n\t}, { global: true });\n\tawait agent.whenIdle();'

if anchor not in c:
    print("ANCHOR_NOT_FOUND")
else:
    c = c.replace(anchor, injection, 1)
    with io.open(p, "w", encoding="utf-8") as f:
        f.write(c)
    print("INJECTED")
