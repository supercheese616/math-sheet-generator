import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:html' as html; // 仅 Web 有效

import 'models/problem.dart';
import 'generators/base_generator.dart';
import 'generators/generators.dart';
import 'utils/html_printer.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '算术题打印生成器',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        fontFamily: "Roboto",
      ),
      home: const GeneratorPage(),
    );
  }
}

class GeneratorPage extends StatefulWidget {
  const GeneratorPage({super.key});

  @override
  State<GeneratorPage> createState() => _GeneratorPageState();
}

class _GeneratorPageState extends State<GeneratorPage> {
  // 默认设置
  MathGenerator _selectedGenerator = allGenerators[0];
  int _count = 45;
  double _fontSize = 32.0;
  double _gap = 32.0;
  bool _includeAnswer = false;
  bool _printUnderline = true; // 新增开关
  List<Problem> _problems = [];

  final TextEditingController _pageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _updatePageCountDisplay();
    _generate();
  }

  void _updatePageCountDisplay() {
    // 计算当前题目占用的页数 (向上取整)
    int pages = (_count / 45).ceil();
    // 只有当文本框内容与计算不一致时才更新，避免光标跳动
    if (_pageController.text != pages.toString()) {
      _pageController.text = pages.toString();
    }
  }

  void _generate() {
    setState(() {
      _problems = _selectedGenerator.generateBatch(_count);
    });
  }

  void _onPageInputChanged(String value) {
    int? pages = int.tryParse(value);
    if (pages != null && pages > 0) {
      setState(() {
        _count = pages * 45;
        // 限制最大数量
        if (_count > 990) _count = 990; 
      });
      _generate();
    }
  }

  void _print() {
    final htmlContent = HtmlPrinter.generateHtml(
      title: _selectedGenerator.name,
      problems: _problems,
      fontSize: _fontSize,
      gap: _gap,
      includeAnswerKey: _includeAnswer,
      showUnderline: _printUnderline,
    );

    // 打开新窗口打印
    if (kIsWeb) {
      final blob = html.Blob([htmlContent], 'text/html');
      final url = html.Url.createObjectUrlFromBlob(blob);
      html.window.open(url, "_blank");
      // 稍后释放 URL，但不能立即释放否则窗口加载不到
      Future.delayed(const Duration(seconds: 10), () {
        html.Url.revokeObjectUrl(url);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("🖨️ 算术题打印生成器"),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            tooltip: "打印",
            onPressed: _print,
          ),
          const SizedBox(width: 20),
        ],
      ),
      body: Row(
        children: [
          // 左侧控制面板
          Container(
            width: 320,
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.grey.shade300)),
              color: Colors.grey.shade50,
            ),
            child: ListView(
              children: [
                const Text("题目设置", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 20),
                
                DropdownButtonFormField<MathGenerator>(
                  value: _selectedGenerator,
                  decoration: const InputDecoration(labelText: "题目类型", border: OutlineInputBorder()),
                  items: allGenerators.map((g) {
                    return DropdownMenuItem(value: g, child: Text(g.name));
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _selectedGenerator = v);
                      _generate();
                    }
                  },
                ),
                const SizedBox(height: 20),
                
                // 页数与题目数联动控制
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          // 减号按钮
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                            onPressed: () {
                              int current = int.tryParse(_pageController.text) ?? 1;
                              if (current > 1) {
                                _pageController.text = (current - 1).toString();
                                _onPageInputChanged(_pageController.text);
                              }
                            },
                          ),
                          // 页数输入框
                          Expanded(
                            child: TextFormField(
                              controller: _pageController,
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              decoration: const InputDecoration(
                                labelText: "页数",
                                contentPadding: EdgeInsets.symmetric(horizontal: 5, vertical: 15),
                                border: OutlineInputBorder(),
                                isDense: true,
                              ),
                              onChanged: _onPageInputChanged,
                            ),
                          ),
                          // 加号按钮
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                            onPressed: () {
                              int current = int.tryParse(_pageController.text) ?? 0;
                              if (current < 22) { // 990 / 45 = 22
                                _pageController.text = (current + 1).toString();
                                _onPageInputChanged(_pageController.text);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("总题目数", style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                            Text("$_count", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                
                Slider(
                  value: _count.toDouble(),
                  min: 15,
                  max: 990,
                  divisions: (990-15)~/15, // 步长约等于15
                  label: _count.toString(),
                  onChanged: (v) {
                    setState(() {
                      _count = v.toInt();
                      _updatePageCountDisplay();
                    });
                  },
                  onChangeEnd: (_) => _generate(),
                ),

                const Divider(height: 40),
                const Text("排版设置", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 10),

                Text("字号大小: ${_fontSize.toInt()}px"),
                Slider(
                  value: _fontSize,
                  min: 12,
                  max: 48,
                  onChanged: (v) => setState(() => _fontSize = v),
                ),

                Text("行间距: ${_gap.toInt()}px"),
                Slider(
                  value: _gap,
                  min: 10,
                  max: 80,
                  onChanged: (v) => setState(() => _gap = v),
                ),

                SwitchListTile(
                  title: const Text("包含参考答案页"),
                  value: _includeAnswer,
                  onChanged: (v) => setState(() => _includeAnswer = v),
                  contentPadding: EdgeInsets.zero,
                ),

                SwitchListTile(
                  title: const Text("打印填空横线"),
                  value: _printUnderline,
                  onChanged: (v) => setState(() => _printUnderline = v),
                  contentPadding: EdgeInsets.zero,
                ),

                const SizedBox(height: 30),
                SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _generate,
                    icon: const Icon(Icons.refresh),
                    label: const Text("刷新题目"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                      foregroundColor: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 50,
                  child: FilledButton.icon(
                    onPressed: _print,
                    icon: const Icon(Icons.print),
                    label: const Text("生成打印页"),
                  ),
                ),
              ],
            ),
          ),

          // 右侧预览区域
          Expanded(
            child: Container(
              color: const Color(0xFFEEEEEE), // 背景灰
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Text("预览模式 (所见即所得)", style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 10),
                      // 多页预览
                      ...List.generate((_problems.length / 45).ceil(), (pageIndex) {
                        int start = pageIndex * 45;
                        int end = (start + 45) < _problems.length ? start + 45 : _problems.length;
                        final pageProblems = _problems.sublist(start, end);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          width: 210 * 3.78, // mm to px approx
                          constraints: const BoxConstraints(minHeight: 297 * 3.78),
                          padding: const EdgeInsets.all(50), 
                          decoration: BoxDecoration(
                            color: Colors.white,
                            boxShadow: const [BoxShadow(blurRadius: 10, color: Colors.black12)],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // 标题 (每一页都有)
                              Text(
                                _selectedGenerator.name,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 10),
                              // 附加信息栏
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("日期: ____________", style: TextStyle(color: Colors.grey[600])),
                                  Text("用时: ____________", style: TextStyle(color: Colors.grey[600])),
                                  Text("得分: ____________", style: TextStyle(color: Colors.grey[600])),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Divider(thickness: 2, color: Colors.black),
                              const SizedBox(height: 20),
                              
                              // 题目网格
                              Wrap(
                                spacing: 20, 
                                runSpacing: _gap,
                                children: pageProblems.map((p) {
                                  return SizedBox(
                                    width: (210 * 3.78 - 100 - 40) / 3 - 1,
                                    child: Text(
                                      "${p.expression} =",
                                      style: TextStyle(fontSize: _fontSize, fontFamily: "serif"),
                                    ),
                                  );
                                }).toList(),
                              ),
                              
                              // 页码
                              if ((_problems.length / 45).ceil() > 1)
                                Padding(
                                  padding: const EdgeInsets.only(top: 20),
                                  child: Text(
                                    "- 第 ${pageIndex + 1} 页 -",
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
