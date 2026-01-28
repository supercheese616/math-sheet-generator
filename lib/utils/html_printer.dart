import 'dart:math';
import '../models/problem.dart';

class HtmlPrinter {
  static const int itemsPerPage = 45; // 固定每页 45 题

  static String generateHtml({
    required String title,
    required List<Problem> problems,
    required double fontSize,
    required double gap,
    required bool includeAnswerKey,
    required bool showUnderline,
  }) {
    // 辅助函数：生成单页 HTML
    String generateSheet(List<Problem> pageProblems, String pageTitle, bool isAnswer) {
      final contentHtml = pageProblems.map((p) {
        if (isAnswer) {
          return '<div class="problem answer">${p.fullEquation}</div>';
        } else {
          // 题目页
          return '''
            <div class="problem">
              ${p.expression} = ${showUnderline ? '<span class="underline"></span>' : ''}
            </div>
          ''';
        }
      }).join('');

      return '''
      <div class="sheet ${isAnswer ? 'answer-key' : ''}">
        <div class="header">
          <h1 class="title">$pageTitle</h1>
          ${!isAnswer ? '''
          <div class="subtitle">
            <span>日期: ____________</span>
            <span>用时: ____________</span>
            <span>得分: ____________</span>
          </div>
          ''' : ''}
        </div>
        <div class="grid">
          $contentHtml
        </div>
        <!-- 如果不足一页，可以用空 div 占位保证布局，但 grid 不需要 -->
      </div>
      ''';
    }

    // 1. 切分题目页
    List<String> sheetsHtml = [];
    int totalPages = (problems.length / itemsPerPage).ceil();

    for (int i = 0; i < totalPages; i++) {
      int start = i * itemsPerPage;
      int end = min(start + itemsPerPage, problems.length);
      List<Problem> pageProblems = problems.sublist(start, end);
      
      // 如果有多页，标题可以带页码，或者保持原样
      // 这里保持每页标题一致，简洁
      sheetsHtml.add(generateSheet(pageProblems, title, false));
    }

    // 2. 切分答案页
    if (includeAnswerKey) {
      for (int i = 0; i < totalPages; i++) {
        int start = i * itemsPerPage;
        int end = min(start + itemsPerPage, problems.length);
        List<Problem> pageProblems = problems.sublist(start, end);
        
        String answerTitle = "$title (答案 ${i + 1}/$totalPages)";
        if (totalPages == 1) answerTitle = "$title (参考答案)";

        sheetsHtml.add(generateSheet(pageProblems, answerTitle, true));
      }
    }

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>$title</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: "Times New Roman", "SimSun", serif;
      -webkit-print-color-adjust: exact;
      background: #f0f0f0; /* 屏幕预览背景 */
    }
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      box-sizing: border-box;
      margin: 20px auto; /* 屏幕预览间距 */
      background: white;
      padding: 0; /* padding由 @page 控制，Web预览需模拟 */
      position: relative;
    }

    /* 屏幕预览时的内边距模拟 */
    @media screen {
      .sheet { 
        padding: 15mm; 
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
    }

    @media print {
      body { background: white; }
      .sheet { 
        box-shadow: none; 
        margin: 0; 
        page-break-after: always; /* 强制分页核心 */
        padding: 0;
      }
      .sheet:last-child {
        page-break-after: auto;
      }
      .no-print { display: none; }
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    
    .title {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    
    .subtitle {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
      display: flex;
      justify-content: space-between;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      column-gap: 10mm;
      row-gap: ${gap}px;
    }

    .problem {
      font-size: ${fontSize}px;
      display: flex;
      align-items: baseline; /* 基线对齐，确保下划线位置正确 */
      white-space: nowrap;
    }

    .underline {
      display: inline-block;
      width: ${fontSize * 2.5}px; /* 根据字号自适应宽度 */
      border-bottom: 2px solid #000;
      margin-left: 5px;
      height: 10px; /* 占位高度，不影响显示，只为了撑开 */
    }

    .answer-key .problem {
      color: #444;
    }
    
    .answer-key .header {
      border-bottom: 1px dashed #999;
    }

    #print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    #print-btn:hover { background: #0056b3; }
  </style>
</head>
<body>
  ${sheetsHtml.join('\n')}

  <button id="print-btn" class="no-print" onclick="window.print()">🖨️ 打印 / 存为PDF</button>
</body>
</html>
    ''';
  }
}
